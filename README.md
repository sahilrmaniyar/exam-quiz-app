# 🎯 Exam Quiz Engine - GitHub Pages Deployment

Full-featured Indian Exam Quiz Engine with **actual diagram image extraction** from PDFs!

## ✨ Features

- 📄 **PDF to Image Conversion** - Extracts every page as high-quality image
- 🖼️ **Diagram Extraction** - Shows actual diagrams from PDF
- ✅ **Answer Detection** - Finds green ticks and correct answers
- 📊 **Progress Tracking** - Saves your session in localStorage
- 🎯 **Section Filtering** - Practice by Reasoning, Quant, GA, English
- 📚 **Wrong Question Revision** - Review mistakes
- 💾 **Offline Support** - Works without internet after loading

## 🚀 Quick Start

### 1. Clone or Fork This Repository

```bash
git clone https://github.com/YOUR_USERNAME/exam-quiz-engine.git
cd exam-quiz-engine
```

### 2. Install Dependencies

```bash
npm install
```

Also install Tailwind CSS:

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### 3. Run Locally

```bash
npm start
```

Visit `http://localhost:3000`

### 4. Build for Production

```bash
npm run build
```

## 📦 Deploy to GitHub Pages

### Method 1: Using gh-pages Package (Recommended)

1. **Install gh-pages**:
```bash
npm install --save-dev gh-pages
```

2. **Update package.json**:

Add your GitHub username and repo name in `homepage`:
```json
"homepage": "https://YOUR_USERNAME.github.io/exam-quiz-engine"
```

The deploy scripts are already added:
```json
"scripts": {
  "predeploy": "npm run build",
  "deploy": "gh-pages -d build"
}
```

3. **Deploy**:
```bash
npm run deploy
```

4. **Enable GitHub Pages**:
   - Go to your repo → Settings → Pages
   - Source: Deploy from a branch
   - Branch: `gh-pages` → `/root`
   - Save

5. **Visit**: `https://YOUR_USERNAME.github.io/exam-quiz-engine`

### Method 2: Manual Deployment

1. **Build the app**:
```bash
npm run build
```

2. **Commit build folder** (if not in .gitignore):
```bash
git add build
git commit -m "Deploy to GitHub Pages"
git push
```

3. **Enable Pages**:
   - Settings → Pages
   - Source: `main` branch → `/build` folder

## 🔧 Configuration

### Connect to AI Backend (For Real Extraction)

The app currently uses mock data. To enable real AI extraction:

1. **Create backend API** (Node.js/Python/etc.) that accepts PDF and returns questions

2. **Update `extractQuestionsWithAI` function** in `src/App.js`:

```javascript
const extractQuestionsWithAI = async (pdfBase64, pdfImages) => {
  const response = await fetch('YOUR_API_ENDPOINT', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      pdf: pdfBase64,
      images: pdfImages.map(img => img.imageData)
    })
  });
  
  const data = await response.json();
  return data.questions;
};
```

### Use Claude API (Alternative)

If you want to use Claude API directly:

1. **Get API Key**: https://console.anthropic.com/

2. **Add to .env**:
```
REACT_APP_ANTHROPIC_API_KEY=your_key_here
```

3. **Update extraction**:
```javascript
const response = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': process.env.REACT_APP_ANTHROPIC_API_KEY,
    'anthropic-version': '2023-06-01'
  },
  body: JSON.stringify({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 32000,
    messages: [{
      role: 'user',
      content: [
        { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: pdfBase64 } },
        { type: 'text', text: 'Extract all questions...' }
      ]
    }]
  })
});
```

**⚠️ Note**: Don't expose API keys in frontend! Use a backend proxy.

## 🛠️ Project Structure

```
exam-quiz-engine/
├── public/
│   └── index.html
├── src/
│   ├── App.js          # Main component
│   ├── App.css         # Styles
│   ├── index.js        # Entry point
│   └── index.css       # Global styles
├── package.json
├── tailwind.config.js
└── README.md
```

## 🎨 Customization

### Change Colors

Edit Tailwind classes in `src/App.js`:
- `from-orange-500 to-red-500` → Header gradient
- `bg-indigo-600` → Primary buttons
- `bg-amber-600` → Warning/revision buttons

### Add More Sections

Update `filterSection` logic to add new categories like Computer Science, etc.

## 📱 Mobile Support

Fully responsive! Works on:
- 📱 Mobile phones
- 📱 Tablets
- 💻 Desktops

## 🐛 Troubleshooting

### PDF.js Worker Error

If you see worker errors, ensure this line is in `App.js`:
```javascript
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
```

### Build Fails

Clear cache and reinstall:
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Deployment Not Updating

Clear GitHub Pages cache:
```bash
git commit --allow-empty -m "Trigger rebuild"
git push
npm run deploy
```

## 🚀 Performance Tips

1. **Limit Pages**: Process max 50 PDF pages
2. **Compress Images**: Use JPEG with 0.85 quality
3. **Lazy Load**: Load questions in batches
4. **Cache**: Use localStorage for persistence

## 📄 License

MIT License - Free to use and modify!

## 🤝 Contributing

1. Fork the repo
2. Create feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m 'Add feature'`
4. Push: `git push origin feature-name`
5. Open Pull Request

## 💡 Future Enhancements

- [ ] Handwritten question recognition
- [ ] Audio question reading
- [ ] Export results as PDF
- [ ] Share quiz with friends
- [ ] Timed test mode
- [ ] Performance analytics
- [ ] Multiple language support

## 📞 Support

Open an issue on GitHub for:
- Bug reports
- Feature requests
- Questions

## 🙏 Credits

Built for Indian exam aspirants preparing for:
- SSC CGL, CHSL, MTS
- Banking (SBI, IBPS)
- Railway (RRB)
- UPSC Prelims
- Defense exams

---

**Made with ❤️ for exam success!**

## 📝 Quick Deployment Checklist

- [ ] Fork/clone repo
- [ ] Run `npm install`
- [ ] Update `homepage` in package.json with your username
- [ ] Run `npm run deploy`
- [ ] Enable GitHub Pages in repo settings
- [ ] Visit your live site!

Your site will be live at: `https://YOUR_USERNAME.github.io/exam-quiz-engine` 🎉
