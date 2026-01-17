import React, { useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

function App() {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState({ correct: 0, incorrect: 0 });
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState('');

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setProcessing(true);
    setStatus('Processing PDF...');

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      let fullText = '';
      for (let i = 1; i <= Math.min(pdf.numPages, 20); i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        fullText += pageText + '\n\n';
      }

      setStatus('Extracting questions...');

      const response = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pdfText: fullText.substring(0, 30000) })
      });

      if (!response.ok) throw new Error('Extraction failed');

      const data = await response.json();
      
      if (data.questions && data.questions.length > 0) {
        setQuestions(data.questions);
        alert(`✅ Extracted ${data.questions.length} questions!`);
      } else {
        throw new Error('No questions found');
      }

    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setProcessing(false);
      setStatus('');
    }
  };

  const handleSubmit = () => {
    if (selected === null) return;
    const isCorrect = selected === questions[currentIndex].correct_option_index;
    setScore({
      correct: isCorrect ? score.correct + 1 : score.correct,
      incorrect: isCorrect ? score.incorrect : score.incorrect + 1
    });
    setShowResult(true);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelected(null);
      setShowResult(false);
    }
  };

  // Upload Screen
  if (questions.length === 0) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ background: 'white', borderRadius: '20px', padding: '40px', maxWidth: '600px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '10px', textAlign: 'center', color: '#333' }}>🎯 Exam Quiz Engine</h1>
          <p style={{ textAlign: 'center', color: '#666', marginBottom: '30px' }}>Upload your exam PDF and start practicing!</p>
          
          <label style={{ display: 'block', padding: '40px', border: '3px dashed #667eea', borderRadius: '12px', textAlign: 'center', cursor: 'pointer', background: '#f8f9ff' }}>
            <input type="file" accept=".pdf" onChange={handleFileUpload} disabled={processing} style={{ display: 'none' }} />
            <div style={{ fontSize: '48px', marginBottom: '10px' }}>📄</div>
            <div style={{ fontSize: '18px', fontWeight: '600', color: '#667eea' }}>
              {processing ? status : 'Click to upload PDF'}
            </div>
            <div style={{ fontSize: '14px', color: '#999', marginTop: '8px' }}>Supports text-based PDFs</div>
          </label>

          <div style={{ marginTop: '30px', padding: '20px', background: '#f0f4ff', borderRadius: '12px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '10px', color: '#333' }}>✨ Features:</h3>
            <ul style={{ fontSize: '14px', color: '#666', lineHeight: '1.8', paddingLeft: '20px' }}>
              <li>AI-powered question extraction</li>
              <li>Interactive quiz interface</li>
              <li>Instant feedback</li>
              <li>Score tracking</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // Quiz Screen
  const q = questions[currentIndex];
  const isCorrect = showResult && selected === q.correct_option_index;

  return (
    <div style={{ minHeight: '100vh', background: '#f5f7fa', padding: '20px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ background: 'white', borderRadius: '12px 12px 0 0', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
            <div>
              <span style={{ background: '#667eea', color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>
                {q.section || 'General'}
              </span>
              <p style={{ fontSize: '14px', color: '#666', marginTop: '8px' }}>Question {currentIndex + 1} of {questions.length}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: '#22c55e', fontWeight: 'bold' }}>✓ {score.correct}</div>
              <div style={{ color: '#ef4444', fontWeight: 'bold' }}>✗ {score.incorrect}</div>
            </div>
          </div>
          <div style={{ height: '4px', background: '#e5e7eb', borderRadius: '2px' }}>
            <div style={{ height: '100%', background: '#667eea', borderRadius: '2px', width: `${((currentIndex + 1) / questions.length) * 100}%`, transition: 'width 0.3s' }}></div>
          </div>
        </div>

        {/* Question */}
        <div style={{ background: 'white', padding: '30px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', lineHeight: '1.6', marginBottom: '25px', color: '#1f2937' }}>
            {q.question_text}
          </h2>

          {/* Options */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {q.options.map((opt, idx) => {
              const isSelected = selected === idx;
              const isCorrectOption = showResult && idx === q.correct_option_index;
              const isWrong = showResult && isSelected && !isCorrect;

              return (
                <button
                  key={idx}
                  onClick={() => !showResult && setSelected(idx)}
                  disabled={showResult}
                  style={{
                    padding: '16px',
                    borderRadius: '8px',
                    border: '2px solid',
                    borderColor: isCorrectOption ? '#22c55e' : isWrong ? '#ef4444' : isSelected ? '#667eea' : '#e5e7eb',
                    background: isCorrectOption ? '#f0fdf4' : isWrong ? '#fef2f2' : isSelected ? '#eef2ff' : 'white',
                    textAlign: 'left',
                    cursor: showResult ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    fontSize: '16px'
                  }}
                >
                  <span style={{ fontWeight: '600', marginRight: '12px' }}>{String.fromCharCode(65 + idx)}.</span>
                  <span>{opt}</span>
                </button>
              );
            })}
          </div>

          {showResult && (
            <div style={{ marginTop: '20px', padding: '16px', borderRadius: '8px', background: isCorrect ? '#f0fdf4' : '#fef2f2', border: `2px solid ${isCorrect ? '#22c55e' : '#ef4444'}` }}>
              <p style={{ fontWeight: '600', color: isCorrect ? '#16a34a' : '#dc2626' }}>
                {isCorrect ? '✅ Correct!' : '❌ Incorrect'}
              </p>
              <p style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>
                Correct answer: Option {String.fromCharCode(65 + q.correct_option_index)}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ background: 'white', borderRadius: '0 0 12px 12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          {!showResult ? (
            <button
              onClick={handleSubmit}
              disabled={selected === null}
              style={{
                width: '100%',
                padding: '16px',
                background: selected !== null ? '#667eea' : '#cbd5e1',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: selected !== null ? 'pointer' : 'not-allowed'
              }}
            >
              Submit Answer
            </button>
          ) : (
            <button
              onClick={handleNext}
              style={{
                width: '100%',
                padding: '16px',
                background: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              {currentIndex < questions.length - 1 ? 'Next Question →' : 'Finish Quiz'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
