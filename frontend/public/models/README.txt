Только .glb (glTF Binary).

Добавить модель:
  1. Экспорт из Blender: File → Export → glTF 2.0 → glTF Binary (.glb)
  2. Файл в public/models/your-house.glb
  3. (опционально) имя/описание в models.meta.json
  4. npm run sync:models

Demo: npm run generate:demo-glb

Рекомендации:
  - Apply scale/rotation (Ctrl+A)
  - Текстуры embedded в .glb
  - Размер < 15 MB
