-- =====================================================
-- Migration: v0.5 - Add parent_value column to sys_dict_item
-- Description: 支持字典项层级关系（如城市属于哪个国家）
-- =====================================================

-- 1. 添加 parent_value 字段
ALTER TABLE "public"."sys_dict_item" 
ADD COLUMN "parent_value" VARCHAR(100);

-- 2. 添加字段注释
COMMENT ON COLUMN "public"."sys_dict_item"."parent_value" IS '父级值 (用于层级关系，如城市属于哪个国家：CN)';

-- 3. 更新现有城市数据（关联到中国）
-- 北京(110100), 上海(310100), 深圳(440300), 杭州(330100)
UPDATE "public"."sys_dict_item" 
SET parent_value = 'CN' 
WHERE dict_code = 'city' AND item_value IN ('110100', '310100', '440300', '330100');

-- 4. 添加索引以优化查询性能
CREATE INDEX IF NOT EXISTS "idx_sys_dict_item_parent_value" 
ON "public"."sys_dict_item"("parent_value");

-- =====================================================
-- 使用示例：添加新的城市数据
-- =====================================================
-- INSERT INTO "public"."sys_dict_item" 
--   (dict_code, item_label, item_value, label_i18n, parent_value, sort_order, status)
-- VALUES 
--   ('city', '东京', 'JP-TK', '{"zh-CN": "东京", "en-US": "Tokyo"}', 'JP', 10, true),
--   ('city', '大阪', 'JP-OS', '{"zh-CN": "大阪", "en-US": "Osaka"}', 'JP', 11, true);
