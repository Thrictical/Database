# Member Database

A professional, real-time cloud database for managing member records. Built with React (TypeScript), Supabase (Cloud Sync), and Vite.

## 🚀 Live Link
[View the Database](https://thrictical.github.io/Database/)

## ✨ Features
- **Cloud Sync**: Data is shared across all your devices instantly.
- **Professional UI**: Spreadsheet-style table with real-time editing.
- **Search & Filtering**: Find members by name quickly.
- **Modern Design**: Clean glassmorphism aesthetic.

## 🛠️ How to Deploy
If you are making changes locally, follow these steps to update your site:

1. **Push your code**:
   ```bash
   git add .
   git commit -m "Update database"
   git push origin main
   ```

2. **Publish to the Web**:
   ```bash
   npm run deploy
   ```

## ☁️ Cloud Setup (Supabase)
To sync data across devices:
1. Create a project at [supabase.com](https://supabase.com).
2. Run the table creation SQL (found in project notes).
3. Add your `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to a `.env` file.

## 📦 Project Structure
- `src/App.tsx`: The main database application and logic.
- `src/App.css`: Professional styling and layout.
- `public/`: Assets and icons.
