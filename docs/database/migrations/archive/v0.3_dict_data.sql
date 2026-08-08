-- v0.3 字典数据初始化脚本
-- 包含 sys_dict (主表) 和 sys_dict_item (子表) 的完整数据
-- 执行前建议先清空这两张表，以避免主键冲突

-- 1. 清空旧数据 (可选，确保数据干净)
TRUNCATE TABLE sys_dict_item, sys_dict RESTART IDENTITY CASCADE;

-- 2. 插入字典主表数据 (sys_dict)
INSERT INTO sys_dict (dict_code, dict_name, description, is_system) VALUES
('audit_status', '审核状态', '作品审核流程状态', true),
('dev_status', '开发状态', '作品当前的开发阶段', true),
('category_code', '作品分类', '作品所属的类别', true),
('country', '国家', '国家列表', true),
('city', '城市', '城市列表', true),
('honor_type', '荣誉类型', '作品获得的荣誉类型', true);

-- 3. 插入字典项数据 (sys_dict_item)
-- 注意：dict_code 必须与上面的 sys_dict 表中的 dict_code 对应

-- 3.1 审核状态 (Audit Status)
INSERT INTO sys_dict_item (dict_code, item_label, item_value, label_i18n, sort_order, status) VALUES 
('audit_status', '待审核', '0', '{"zh-CN": "待审核", "en-US": "Pending"}', 0, true), 
('audit_status', '已通过', '1', '{"zh-CN": "已通过", "en-US": "Approved"}', 1, true), 
('audit_status', '已拒绝', '2', '{"zh-CN": "已拒绝", "en-US": "Rejected"}', 2, true);

-- 3.2 开发状态 (Development Status)
INSERT INTO sys_dict_item (dict_code, item_label, item_value, label_i18n, sort_order, status) VALUES 
('dev_status', '创意构思', 'ideation', '{"zh-CN": "创意构思", "en-US": "Ideation"}', 0, true), 
('dev_status', '原型设计', 'prototype', '{"zh-CN": "原型设计", "en-US": "Prototype"}', 1, true), 
('dev_status', '开发中', 'development', '{"zh-CN": "开发中", "en-US": "In Development"}', 2, true), 
('dev_status', '已上线', 'released', '{"zh-CN": "已上线", "en-US": "Released"}', 3, true);

-- 3.3 作品分类 (Project Category)
INSERT INTO sys_dict_item (dict_code, item_label, item_value, label_i18n, sort_order, status) VALUES 
('category_code', '游戏', 'game', '{"zh-CN": "游戏", "en-US": "Game"}', 0, true), 
('category_code', '工具', 'tool', '{"zh-CN": "工具", "en-US": "Tool"}', 1, true), 
('category_code', 'AI应用', 'ai', '{"zh-CN": "AI应用", "en-US": "AI App"}', 2, true), 
('category_code', '社交', 'social', '{"zh-CN": "社交", "en-US": "Social"}', 3, true), 
('category_code', '教育', 'education', '{"zh-CN": "教育", "en-US": "Education"}', 4, true);

-- 3.4 国家 (Country)
INSERT INTO sys_dict_item (dict_code, item_label, item_value, label_i18n, sort_order, status) VALUES 
('country', '中国', 'CN', '{"zh-CN": "中国", "en-US": "China"}', 0, true), 
('country', '美国', 'US', '{"zh-CN": "美国", "en-US": "USA"}', 1, true), 
('country', '日本', 'JP', '{"zh-CN": "日本", "en-US": "Japan"}', 2, true);

-- 3.5 城市 (City)
INSERT INTO sys_dict_item (dict_code, item_label, item_value, label_i18n, sort_order, status) VALUES 
('city', '北京', '110100', '{"zh-CN": "北京", "en-US": "Beijing"}', 0, true), 
('city', '上海', '310100', '{"zh-CN": "上海", "en-US": "Shanghai"}', 1, true), 
('city', '深圳', '440300', '{"zh-CN": "深圳", "en-US": "Shenzhen"}', 2, true), 
('city', '杭州', '330100', '{"zh-CN": "杭州", "en-US": "Hangzhou"}', 3, true);

-- 3.6 荣誉类型 (Honor Type)
INSERT INTO sys_dict_item (dict_code, item_label, item_value, label_i18n, sort_order, status) VALUES 
('honor_type', '社区推荐', 'community_choice', '{"zh-CN": "社区推荐", "en-US": "Community Choice"}', 0, true), 
('honor_type', '城市之星', 'city_star', '{"zh-CN": "城市之星", "en-US": "City Star"}', 1, true), 
('honor_type', '年度最佳', 'best_of_year', '{"zh-CN": "年度最佳", "en-US": "Best of Year"}', 2, true);
