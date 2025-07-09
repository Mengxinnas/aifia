-- 使用记录表
CREATE TABLE IF NOT EXISTS usage_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature_type VARCHAR(50) NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  api_endpoint TEXT,
  request_size INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 购买记录表
CREATE TABLE IF NOT EXISTS purchase_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  package_type VARCHAR(20) NOT NULL CHECK (package_type IN ('5_times', '10_times')),
  price DECIMAL(10,2) NOT NULL,
  purchase_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  remaining_uses INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 添加索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_usage_records_user_id ON usage_records(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_records_feature_type ON usage_records(feature_type);
CREATE INDEX IF NOT EXISTS idx_usage_records_used_at ON usage_records(used_at);

CREATE INDEX IF NOT EXISTS idx_purchase_records_user_id ON purchase_records(user_id);
CREATE INDEX IF NOT EXISTS idx_purchase_records_remaining_uses ON purchase_records(remaining_uses);
CREATE INDEX IF NOT EXISTS idx_purchase_records_purchase_time ON purchase_records(purchase_time);

-- 启用行级安全策略
ALTER TABLE usage_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_records ENABLE ROW LEVEL SECURITY;

-- 用户只能访问自己的记录
CREATE POLICY "Users can only see their own usage records" ON usage_records
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only see their own purchase records" ON purchase_records
  FOR ALL USING (auth.uid() = user_id);

-- 添加用户积分表
CREATE TABLE IF NOT EXISTS user_credits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  free_uses_consumed INTEGER NOT NULL DEFAULT 0,
  remaining_uses INTEGER NOT NULL DEFAULT 0,
  total_purchased INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 添加兑换码表
CREATE TABLE IF NOT EXISTS redemption_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(20) NOT NULL UNIQUE,
  package_type VARCHAR(20) NOT NULL CHECK (package_type IN ('5_times', '10_times')),
  uses INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  is_used BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id)
);

-- 添加兑换历史表
CREATE TABLE IF NOT EXISTS redemption_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code_id UUID NOT NULL REFERENCES redemption_codes(id),
  redeemed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  uses_added INTEGER NOT NULL
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON user_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_redemption_codes_code ON redemption_codes(code);
CREATE INDEX IF NOT EXISTS idx_redemption_history_user_id ON redemption_history(user_id);

-- 启用RLS
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE redemption_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE redemption_history ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略
CREATE POLICY "Users can only see their own credits" ON user_credits
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view redemption codes" ON redemption_codes
  FOR SELECT USING (true);

CREATE POLICY "Users can only see their own redemption history" ON redemption_history
  FOR ALL USING (auth.uid() = user_id);

-- 创建消费使用次数的函数
CREATE OR REPLACE FUNCTION consume_usage(user_uuid UUID, feature_name TEXT)
RETURNS TABLE(success BOOLEAN, message TEXT) AS $$
DECLARE
  user_credits_record user_credits%ROWTYPE;
  free_remaining INTEGER;
BEGIN
  -- 获取或创建用户积分记录
  SELECT * INTO user_credits_record 
  FROM user_credits 
  WHERE user_id = user_uuid;
  
  -- 如果用户积分记录不存在，创建一个
  IF NOT FOUND THEN
    INSERT INTO user_credits (user_id, free_uses_consumed, remaining_uses, total_purchased)
    VALUES (user_uuid, 0, 0, 0)
    RETURNING * INTO user_credits_record;
  END IF;
  
  -- 计算剩余免费次数
  free_remaining := 6 - user_credits_record.free_uses_consumed;
  
  -- 检查是否可以使用
  IF free_remaining > 0 THEN
    -- 消费免费次数
    UPDATE user_credits 
    SET free_uses_consumed = free_uses_consumed + 1,
        updated_at = NOW()
    WHERE user_id = user_uuid;
    
    -- 记录使用
    INSERT INTO usage_records (user_id, feature_type, used_at)
    VALUES (user_uuid, feature_name, NOW());
    
    RETURN QUERY SELECT TRUE, format('使用成功，剩余免费次数：%s', free_remaining - 1);
    
  ELSIF user_credits_record.remaining_uses > 0 THEN
    -- 消费付费次数
    UPDATE user_credits 
    SET remaining_uses = remaining_uses - 1,
        updated_at = NOW()
    WHERE user_id = user_uuid;
    
    -- 记录使用
    INSERT INTO usage_records (user_id, feature_type, used_at)
    VALUES (user_uuid, feature_name, NOW());
    
    RETURN QUERY SELECT TRUE, format('使用成功，剩余付费次数：%s', user_credits_record.remaining_uses - 1);
    
  ELSE
    -- 无可用次数 - 添加联系方式
    RETURN QUERY SELECT FALSE, '使用次数已用完，请联系 15001314535 购买更多使用次数';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建兑换码事务函数
CREATE OR REPLACE FUNCTION redeem_code_transaction(code_text TEXT, user_uuid UUID)
RETURNS TABLE(success BOOLEAN, message TEXT, uses_added INTEGER) AS $$
DECLARE
  code_record redemption_codes%ROWTYPE;
  user_credits_record user_credits%ROWTYPE;
BEGIN
  -- 查找兑换码
  SELECT * INTO code_record 
  FROM redemption_codes 
  WHERE code = code_text AND NOT is_used;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, '兑换码无效或已被使用', 0;
    RETURN;
  END IF;
  
  -- 检查是否过期
  IF code_record.expires_at IS NOT NULL AND code_record.expires_at < NOW() THEN
    RETURN QUERY SELECT FALSE, '兑换码已过期', 0;
    RETURN;
  END IF;
  
  -- 获取或创建用户积分记录
  SELECT * INTO user_credits_record 
  FROM user_credits 
  WHERE user_id = user_uuid;
  
  IF NOT FOUND THEN
    INSERT INTO user_credits (user_id, free_uses_consumed, remaining_uses, total_purchased)
    VALUES (user_uuid, 0, code_record.uses, code_record.uses)
    RETURNING * INTO user_credits_record;
  ELSE
    -- 更新用户积分
    UPDATE user_credits 
    SET remaining_uses = remaining_uses + code_record.uses,
        total_purchased = total_purchased + code_record.uses,
        updated_at = NOW()
    WHERE user_id = user_uuid;
  END IF;
  
  -- 标记兑换码为已使用
  UPDATE redemption_codes 
  SET is_used = TRUE 
  WHERE id = code_record.id;
  
  -- 记录兑换历史
  INSERT INTO redemption_history (user_id, code_id, uses_added)
  VALUES (user_uuid, code_record.id, code_record.uses);
  
  RETURN QUERY SELECT TRUE, format('兑换成功，获得 %s 次使用机会', code_record.uses), code_record.uses;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 