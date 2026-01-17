# 🚀 DEPLOYMENT GUIDE

## Step-by-Step GitHub Pages Deployment

### Prerequisites
- GitHub account
- Git installed on your computer
- Node.js installed (v14+)

---

## 📋 STEPS

### 1️⃣ Create GitHub Repository

1. Go to https://github.com
2. Click **"New Repository"**
3. Name: `exam-quiz-engine` (or any name)
4. Description: "Indian Exam Quiz Engine"
5. Public repository
6. Don't initialize with README (we have one)
7. Click **"Create Repository"**

---

### 2️⃣ Clone This Project

```bash
# Navigate to where you want the project
cd ~/Documents

# Clone (or just copy these files)
git clone https://github.com/YOUR_USERNAME/exam-quiz-engine.git
cd exam-quiz-engine
```

---

### 3️⃣ Install Dependencies

```bash
# Install all packages
npm install

# Install Tailwind
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

---

### 4️⃣ Update Configuration

Edit `package.json`:

```json
{
  "homepage": "https://YOUR_GITHUB_USERNAME.github.io/exam-quiz-engine"
}
```

**Replace `YOUR_GITHUB_USERNAME` with your actual GitHub username!**

---

### 5️⃣ Test Locally

```bash
# Start development server
npm start
```

- Opens at http://localhost:3000
- Test the upload, quiz features
- Make sure everything works

---

### 6️⃣ Push to GitHub

```bash
# Initialize git (if not already)
git init

# Add remote
git remote add origin https://github.com/YOUR_USERNAME/exam-quiz-engine.git

# Stage all files
git add .

# Commit
git commit -m "Initial commit - Exam Quiz Engine"

# Push to main branch
git push -u origin main
```

---

### 7️⃣ Deploy to GitHub Pages

```bash
# This builds and deploys automatically
npm run deploy
```

This command:
1. Runs `npm run build` (creates production build)
2. Pushes `build/` folder to `gh-pages` branch
3. Your site is deployed!

---

### 8️⃣ Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** tab
3. Scroll to **Pages** section (left sidebar)
4. Under **Source**:
   - Branch: `gh-pages`
   - Folder: `/ (root)`
5. Click **Save**

---

### 9️⃣ Access Your Live Site! 🎉

Your site will be live at:
```
https://YOUR_USERNAME.github.io/exam-quiz-engine
```

⏰ May take 2-5 minutes for first deployment

---

## 🔄 Updating Your Site

After making changes:

```bash
# Make your changes to code

# Test locally
npm start

# Deploy updated version
npm run deploy
```

That's it! Changes go live in 1-2 minutes.

---

## 🎨 Customization Guide

### Change App Title

Edit `public/index.html`:
```html
<title>Your Custom Title</title>
```

### Change Colors

Edit `src/App.js` - search for these classes:
- `from-orange-500 to-red-500` - Header
- `bg-indigo-600` - Primary buttons
- `bg-green-600` - Success buttons

### Add Logo

1. Add `logo.png` to `public/`
2. Update `public/index.html`:
```html
<link rel="icon" href="%PUBLIC_URL%/logo.png" />
```

---

## 🐛 Common Issues

### Issue: `npm install` fails

**Solution:**
```bash
# Clear cache
npm cache clean --force

# Delete node_modules
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

### Issue: Deployment fails

**Solution:**
```bash
# Check remote
git remote -v

# Re-add if needed
git remote set-url origin https://github.com/YOUR_USERNAME/exam-quiz-engine.git

# Try again
npm run deploy
```

### Issue: Site shows old version

**Solution:**
```bash
# Force refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

# Or clear browser cache
# Or try incognito mode
```

### Issue: White screen after deployment

**Solution:**

Check `package.json` has correct homepage:
```json
"homepage": "https://YOUR_USERNAME.github.io/exam-quiz-engine"
```

Then redeploy:
```bash
npm run deploy
```

---

## 📊 File Size Limits

GitHub Pages limits:
- ✅ Site size: 1 GB
- ✅ Monthly bandwidth: 100 GB
- ✅ Builds: 10 per hour

Perfect for this app! 🎯

---

## 🔒 Security Note

**Never commit API keys!**

If using Claude API:
1. Create `.env` file (already in .gitignore)
2. Add keys there:
```
REACT_APP_ANTHROPIC_API_KEY=your_key
```
3. Use in code:
```javascript
const apiKey = process.env.REACT_APP_ANTHROPIC_API_KEY;
```

---

## ✅ Deployment Checklist

Before deploying:

- [ ] `npm install` completed
- [ ] `npm start` works locally
- [ ] Updated `homepage` in package.json
- [ ] Git repository created on GitHub
- [ ] Code pushed to main branch
- [ ] `npm run deploy` executed successfully
- [ ] GitHub Pages enabled in settings
- [ ] Site loads at github.io URL

---

## 🎯 Next Steps

After deployment:

1. **Share**: Send link to friends
2. **Test**: Upload real PDFs
3. **Customize**: Add your branding
4. **Extend**: Add new features
5. **Monitor**: Check GitHub Pages analytics

---

## 📞 Need Help?

1. Check README.md
2. Google the error message
3. Check GitHub Issues
4. Ask on Stack Overflow
5. Open issue in this repo

---

## 🎉 Congratulations!

You now have a **live, working exam quiz engine** deployed to the internet!

URL: `https://YOUR_USERNAME.github.io/exam-quiz-engine`

Share it with your friends preparing for exams! 🚀📚

---

**Happy Coding & Good Luck with Exams!** 🎓
