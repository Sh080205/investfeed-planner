import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// viteSingleFile: ทำให้ `npm run build` ได้ dist/index.html "ไฟล์เดียวจบ"
// เอาไปวางที่ไหนก็ได้ (เช่น OneDrive ข้าง planner_v2.html เดิม) แล้วเปิดใน browser ตรง ๆ
// — สำคัญต่อ auto-migration เพราะจะอยู่ origin file:// เดียวกับ planner เดิม
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  server: { port: 5173, strictPort: true },
});
