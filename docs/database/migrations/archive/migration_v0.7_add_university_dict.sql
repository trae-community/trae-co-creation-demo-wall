-- TRAE Demo Wall v0.7 - 添加大学字典数据迁移脚本
-- 添加"大学"省份和15所大学作为城市
-- 执行前请确保 Docker 数据库服务已启动

-- ========== 添加"大学"省份（country字典）==========
INSERT INTO sys_dict_item (dict_code, item_label, item_value, sort_order, status, label_i18n, parent_value)
SELECT * FROM (VALUES
  ('country', '大学', 'UNIV', 100, true, '{"en-US": "University", "zh-CN": "大学"}'::jsonb, null)
) AS v(dict_code, item_label, item_value, sort_order, status, label_i18n, parent_value)
WHERE NOT EXISTS (
  SELECT 1 FROM sys_dict_item WHERE dict_code = v.dict_code AND item_value = v.item_value
);

-- ========== 添加大学作为城市（city字典）==========
INSERT INTO sys_dict_item (dict_code, item_label, item_value, sort_order, status, label_i18n, parent_value)
SELECT * FROM (VALUES
  ('city', '山东大学', 'SDU', 1, true, '{"en-US": "Shandong University", "zh-CN": "山东大学"}'::jsonb, 'UNIV'),
  ('city', '中国矿业大学', 'CUMT', 2, true, '{"en-US": "China University of Mining and Technology", "zh-CN": "中国矿业大学"}'::jsonb, 'UNIV'),
  ('city', '江西师范大学', 'JXNU', 3, true, '{"en-US": "Jiangxi Normal University", "zh-CN": "江西师范大学"}'::jsonb, 'UNIV'),
  ('city', '西安石油大学', 'XSYU', 4, true, '{"en-US": "Xi''an Shiyou University", "zh-CN": "西安石油大学"}'::jsonb, 'UNIV'),
  ('city', '南昌航空大学', 'NCHU', 5, true, '{"en-US": "Nanchang Hangkong University", "zh-CN": "南昌航空大学"}'::jsonb, 'UNIV'),
  ('city', '中南大学', 'CSU', 6, true, '{"en-US": "Central South University", "zh-CN": "中南大学"}'::jsonb, 'UNIV'),
  ('city', '四川大学', 'SCU', 7, true, '{"en-US": "Sichuan University", "zh-CN": "四川大学"}'::jsonb, 'UNIV'),
  ('city', '成都东软学院', 'CNU', 8, true, '{"en-US": "Chengdu Neusoft University", "zh-CN": "成都东软学院"}'::jsonb, 'UNIV'),
  ('city', '中国人民大学', 'RUC', 9, true, '{"en-US": "Renmin University of China", "zh-CN": "中国人民大学"}'::jsonb, 'UNIV'),
  ('city', '桂林电子科技大学', 'GUET', 10, true, '{"en-US": "Guilin University of Electronic Technology", "zh-CN": "桂林电子科技大学"}'::jsonb, 'UNIV'),
  ('city', '浙江师范大学', 'ZJNU', 11, true, '{"en-US": "Zhejiang Normal University", "zh-CN": "浙江师范大学"}'::jsonb, 'UNIV'),
  ('city', '西北工业大学', 'NPU', 12, true, '{"en-US": "Northwestern Polytechnical University", "zh-CN": "西北工业大学"}'::jsonb, 'UNIV'),
  ('city', '青岛大学', 'QU', 13, true, '{"en-US": "Qingdao University", "zh-CN": "青岛大学"}'::jsonb, 'UNIV'),
  ('city', '山东财经大学', 'SDUFE', 14, true, '{"en-US": "Shandong University of Finance and Economics", "zh-CN": "山东财经大学"}'::jsonb, 'UNIV'),
  ('city', '江西农业大学', 'JXAU', 15, true, '{"en-US": "Jiangxi Agricultural University", "zh-CN": "江西农业大学"}'::jsonb, 'UNIV')
) AS v(dict_code, item_label, item_value, sort_order, status, label_i18n, parent_value)
WHERE NOT EXISTS (
  SELECT 1 FROM sys_dict_item WHERE dict_code = v.dict_code AND item_value = v.item_value
);
