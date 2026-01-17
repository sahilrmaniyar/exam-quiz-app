import React, { useState, useEffect } from 'react';
import { Upload, RotateCcw, CheckCircle, XCircle, BarChart3, AlertCircle, Sparkles } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import './App.css';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

function App() {
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState({ correct: 0, incorrect: 0, attempted: 0 });
  const [wrongQuestions, setWrongQuestions] = useState([]);
  const [mode, setMode] = useState('upload');
  const [filterSection, setFilterSection] = useState('all');
  const [processing, setProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');

  useEffect(() => {
    const savedData = localStorage.getItem('exam_questions');
    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        setQuestions(data.questions || []);
        setScore(data.score || { correct: 0, incorrect: 0, attempted: 0 });
        setWrongQuestions(data.wrongQuestions || []);
      } catch (e) {
        console.log('No saved data');
      }
    }
  }, []);

  const saveToStorage = (newQuestions, newScore, newWrongQuestions) => {
    localStorage.setItem('exam_questions', JSON.stringify({
      questions: newQuestions,
      score: newScore,
      wrongQuestions: newWrongQuestions
    }));
  };

  const convertPDFToImages = async (file) => {
    try {
      setProcessingStatus('Converting PDF to images...');
      
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const images = [];
      
      const maxPages = Math.min(pdf.numPages, 50);
      
      for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
        setProcessingStatus(`Processing page ${pageNum} of ${maxPages}...`);
        
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 2.0 });
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        
        await page.render({
          canvasContext: context,
          viewport: viewport
        }).promise;
        
        const imageData = canvas.toDataURL('image/jpeg', 0.9);
        images.push({
          pageNumber: pageNum,
          imageData: imageData
        });
      }
      
      return images;
    } catch (error) {
      console.error('PDF conversion error:', error);
      return null;
    }
  };

  const extractQuestionsWithAI = async (pdfBase64, pdfImages) => {
  try {
    setProcessingStatus('Extracting text from PDF...');
    
    // Extract text from PDF using pdf.js
    const arrayBuffer = Uint8Array.from(atob(pdfBase64), c => c.charCodeAt(0)).buffer;
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      fullText += pageText + '\n\n';
    }
    
    setProcessingStatus('Sending to AI for extraction...');
    
    // Call our Groq backend
    const response = await fetch('/api/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pdfText: fullText })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Extraction failed');
    }

    const data = await response.json();
    
    if (!data.success || !data.questions) {
      throw new Error('Invalid response from AI');
    }
    
    setProcessingStatus('Linking diagram images...');
    
    // Link diagram images to questions
    const questions = data.questions.map((q, index) => {
      if (q.has_diagram) {
        // Estimate which PDF page this question is on
        const questionsPerPage = Math.ceil(data.questions.length / pdfImages.length);
        const estimatedPage = Math.floor(index / questionsPerPage);
        const pageImage = pdfImages[Math.min(estimatedPage, pdfImages.length - 1)];
        
        if (pageImage) {
          q.diagram_image = pageImage.imageData;
        }
      }
      return q;
    });
    
    return questions;
    
  } catch (error) {
    console.error('AI extraction error:', error);
    throw error;
  }
};

  const extractQuestionsManually = async (pdfImages) => {
    // Simple heuristic extraction - you can enhance this
    // In production, send to your AI backend
    
    const questions = [];
    const questionsPerPage = 10; // Estimate
    
    pdfImages.forEach((pageImage, pageIndex) => {
      for (let i = 0; i < questionsPerPage; i++) {
        const questionNum = pageIndex * questionsPerPage + i + 1;
        questions.push({
          question_number: questionNum,
          page_number: pageIndex + 1,
          section: questionNum <= 25 ? 'Reasoning' : questionNum <= 50 ? 'Quantitative' : 'General Awareness',
          question_text: `Question ${questionNum} from page ${pageIndex + 1}`,
          options: ['Option A', 'Option B', 'Option C', 'Option D'],
          correct_option_index: 0,
          has_marked_answer: false,
          has_diagram: (questionNum % 5 === 0), // Every 5th question has diagram
          diagram_image: (questionNum % 5 === 0) ? pageImage.imageData : null
        });
      }
    });
    
    return questions.slice(0, 100); // Limit to 100 questions
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setProcessing(true);
    setProcessingStatus('Reading file...');

    try {
      if (file.type === 'application/pdf') {
        const pdfImages = await convertPDFToImages(file);
        
        if (pdfImages && pdfImages.length > 0) {
          const reader = new FileReader();
          reader.onload = async (event) => {
            const base64Data = event.target.result.split(',')[1];
            const extractedQuestions = await extractQuestionsWithAI(base64Data, pdfImages);
            
            if (extractedQuestions.length > 0) {
              setQuestions(extractedQuestions);
              saveToStorage(extractedQuestions, { correct: 0, incorrect: 0, attempted: 0 }, []);
              setMode('quiz');
              setCurrentQuestionIndex(0);
              
              const diagramCount = extractedQuestions.filter(q => q.has_diagram).length;
              const withImages = extractedQuestions.filter(q => q.diagram_image).length;
              
              alert(`✅ Success!\n\n` +
                    `📝 ${extractedQuestions.length} questions\n` +
                    `📊 ${diagramCount} diagram questions\n` +
                    `🖼️ ${withImages} with images extracted!`);
            }
          };
          reader.readAsDataURL(file);
        }
      } else if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = async (event) => {
          const base64Data = event.target.result.split(',')[1];
          // Handle image upload
          alert('Image upload - implement AI extraction here');
        };
        reader.readAsDataURL(file);
      }
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setProcessing(false);
      setProcessingStatus('');
    }
  };

  const getFilteredQuestions = () => {
    if (filterSection === 'wrong') return wrongQuestions;
    if (filterSection === 'all') return questions;
    return questions.filter(q => q.section && q.section.toLowerCase().includes(filterSection.toLowerCase()));
  };

  const handleOptionSelect = (index) => {
    if (showResult) return;
    setSelectedOption(index);
  };

  const handleSubmitAnswer = () => {
    if (selectedOption === null) return;
    const currentQ = getFilteredQuestions()[currentQuestionIndex];
    const isCorrect = selectedOption === currentQ.correct_option_index;
    
    const newScore = {
      ...score,
      attempted: score.attempted + 1,
      correct: isCorrect ? score.correct + 1 : score.correct,
      incorrect: isCorrect ? score.incorrect : score.incorrect + 1
    };
    
    let newWrongQuestions = [...wrongQuestions];
    if (!isCorrect && !newWrongQuestions.find(q => q.question_number === currentQ.question_number)) {
      newWrongQuestions.push(currentQ);
    }
    
    setScore(newScore);
    setWrongQuestions(newWrongQuestions);
    setShowResult(true);
    saveToStorage(questions, newScore, newWrongQuestions);
  };

  const handleNextQuestion = () => {
    const filtered = getFilteredQuestions();
    if (currentQuestionIndex < filtered.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedOption(null);
      setShowResult(false);
    } else {
      setMode('results');
    }
  };

  const resetQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setShowResult(false);
    setScore({ correct: 0, incorrect: 0, attempted: 0 });
    setWrongQuestions([]);
    setMode('quiz');
    saveToStorage(questions, { correct: 0, incorrect: 0, attempted: 0 }, []);
  };

  const currentQuestion = getFilteredQuestions()[currentQuestionIndex];

  // Upload Screen
  if (mode === 'upload') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 p-4 md:p-8">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-orange-500 to-red-500 p-8 text-white">
              <div className="flex items-center justify-center mb-3">
                <Sparkles className="w-10 h-10 mr-2" />
                <h1 className="text-3xl font-bold">Exam Quiz Engine</h1>
              </div>
              <p className="text-center text-orange-100">With Diagram Image Extraction!</p>
            </div>

            <div className="p-8">
              {questions.length > 0 && (
                <div className="mb-6 p-5 bg-green-50 border-2 border-green-300 rounded-xl">
                  <p className="text-green-900 font-bold mb-2">✓ {questions.length} questions loaded</p>
                  <button onClick={() => setMode('quiz')} className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                    Continue Practice
                  </button>
                </div>
              )}

              <div className="border-2 border-dashed border-orange-300 rounded-2xl p-8 text-center">
                <Upload className="w-14 h-14 text-orange-500 mx-auto mb-3" />
                <label className="cursor-pointer">
                  <span className="text-lg font-bold text-gray-800 block mb-2">
                    {processing ? processingStatus : 'Upload PDF'}
                  </span>
                  <input type="file" accept=".pdf" onChange={handleFileUpload} className="hidden" disabled={processing} />
                  <p className="text-gray-600 text-sm">Extracts diagrams as images!</p>
                </label>
              </div>

              <div className="mt-6 p-5 bg-blue-50 rounded-xl">
                <h3 className="font-bold text-blue-900 mb-2">✨ Features:</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>✓ PDF to image conversion</li>
                  <li>✓ Actual diagram extraction</li>
                  <li>✓ Offline storage</li>
                  <li>✓ No external dependencies</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Results Screen
  if (mode === 'results') {
    const pct = score.attempted > 0 ? ((score.correct / score.attempted) * 100).toFixed(1) : 0;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 to-purple-50 p-4 md:p-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <BarChart3 className="w-16 h-16 text-purple-600 mx-auto mb-3" />
            <h2 className="text-3xl font-bold text-center mb-6">Results</h2>
            
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="p-5 bg-green-50 rounded-xl text-center">
                <p className="text-3xl font-bold text-green-600">{score.correct}</p>
                <p className="text-sm">Correct</p>
              </div>
              <div className="p-5 bg-red-50 rounded-xl text-center">
                <p className="text-3xl font-bold text-red-600">{score.incorrect}</p>
                <p className="text-sm">Wrong</p>
              </div>
              <div className="p-5 bg-blue-50 rounded-xl text-center">
                <p className="text-3xl font-bold text-blue-600">{pct}%</p>
                <p className="text-sm">Score</p>
              </div>
            </div>

            <div className="space-y-3">
              <button onClick={resetQuiz} className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg font-bold">
                <RotateCcw className="inline w-4 h-4 mr-2" />Restart
              </button>
              {wrongQuestions.length > 0 && (
                <button onClick={() => { setFilterSection('wrong'); setCurrentQuestionIndex(0); setMode('quiz'); }}
                  className="w-full px-6 py-3 bg-amber-600 text-white rounded-lg font-bold">
                  Revise {wrongQuestions.length} Wrong
                </button>
              )}
              <button onClick={() => setMode('upload')} className="w-full px-6 py-3 bg-gray-600 text-white rounded-lg font-bold">
                New Paper
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Quiz Screen
  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 p-6 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <AlertCircle className="w-14 h-14 text-amber-500 mx-auto mb-3" />
          <p className="text-gray-700 mb-4">No questions</p>
          <button onClick={() => setMode('upload')} className="px-5 py-2 bg-orange-600 text-white rounded-lg">Upload</button>
        </div>
      </div>
    );
  }

  const filtered = getFilteredQuestions();
  const isCorrect = showResult && selectedOption === currentQuestion.correct_option_index;
  const progress = ((currentQuestionIndex + 1) / filtered.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-t-xl shadow-lg p-5">
          <div className="flex justify-between mb-3">
            <div>
              <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold">
                {currentQuestion.section}
              </span>
              <p className="text-xs text-gray-600 mt-1">Q {currentQuestionIndex + 1}/{filtered.length}</p>
            </div>
            <div className="flex gap-3">
              <span className="text-green-600 font-bold">✓ {score.correct}</span>
              <span className="text-red-600 font-bold">✗ {score.incorrect}</span>
            </div>
          </div>
          
          <div className="h-2 bg-gray-200 rounded-full mb-3">
            <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${progress}%` }}></div>
          </div>
        </div>

        <div className="bg-white shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4">{currentQuestion.question_text}</h2>

          {currentQuestion.has_diagram && currentQuestion.diagram_image && (
            <div className="mb-5 p-4 bg-blue-50 rounded-xl border-2 border-blue-300">
              <p className="font-bold text-blue-900 mb-3">📐 Diagram:</p>
              <img src={currentQuestion.diagram_image} alt="Diagram" className="max-w-full rounded-lg border" style={{ maxHeight: '400px' }} />
            </div>
          )}

          <div className="space-y-3">
            {currentQuestion.options.map((opt, idx) => {
              const selected = selectedOption === idx;
              const correctOpt = showResult && idx === currentQuestion.correct_option_index;
              const wrongSel = showResult && selected && !isCorrect;

              return (
                <button key={idx} onClick={() => handleOptionSelect(idx)} disabled={showResult}
                  className={`w-full text-left p-4 rounded-lg border-2 transition ${
                    correctOpt ? 'bg-green-50 border-green-500' : wrongSel ? 'bg-red-50 border-red-500' : 
                    selected ? 'bg-indigo-50 border-indigo-500' : 'border-gray-300'
                  }`}>
                  <div className="flex items-center">
                    <span className="font-bold mr-3">{String.fromCharCode(65 + idx)}.</span>
                    <span className="flex-1">{opt}</span>
                    {correctOpt && <CheckCircle className="w-5 h-5 text-green-600" />}
                    {wrongSel && <XCircle className="w-5 h-5 text-red-600" />}
                  </div>
                </button>
              );
            })}
          </div>

          {showResult && (
            <div className={`mt-5 p-4 rounded-lg ${isCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
              <p className={`font-bold ${isCorrect ? 'text-green-800' : 'text-red-800'}`}>
                {isCorrect ? '✅ Correct!' : '❌ Incorrect'}
              </p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-b-xl shadow-lg p-5">
          {!showResult ? (
            <button onClick={handleSubmitAnswer} disabled={selectedOption === null}
              className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg disabled:bg-gray-400 font-bold">
              Submit
            </button>
          ) : (
            <button onClick={handleNextQuestion} className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg font-bold">
              {currentQuestionIndex < filtered.length - 1 ? 'Next →' : 'Results'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
