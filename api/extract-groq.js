export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { pdfText } = req.body;

    console.log('Calling Groq API...');

    // Call Groq API
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'mixtral-8x7b-32768',
        messages: [{
          role: 'user',
          content: `You are an exam question extractor. Extract ALL questions from this Indian competitive exam text.

TEXT:
${pdfText.substring(0, 25000)}

INSTRUCTIONS:
1. Extract EVERY question (don't skip any)
2. For each question find:
   - Question number
   - Section (Reasoning/Quantitative/GA/English)
   - Complete question text
   - All 4 options (A, B, C, D)
   - Correct answer if marked with ✓ or green highlight
   - Whether it has diagram/figure

3. Return ONLY valid JSON array in this exact format:
[
  {
    "question_number": 1,
    "section": "Reasoning",
    "question_text": "Complete question text here",
    "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
    "correct_option_index": 0,
    "has_marked_answer": false,
    "has_diagram": false
  }
]

CRITICAL: Return ONLY the JSON array, no other text, no markdown, no explanation.`
        }],
        temperature: 0.1,
        max_tokens: 8000
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Groq API error: ${error}`);
    }

    const data = await response.json();
    console.log('Groq response received');

    const text = data.choices[0].message.content;
    
    // Extract JSON from response
    let jsonText = text.trim();
    
    // Remove markdown code blocks if present
    jsonText = jsonText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    
    // Find JSON array
    const jsonMatch = jsonText.match(/\[[\s\S]*\]/);
    
    if (!jsonMatch) {
      console.error('No JSON found in response:', text);
      throw new Error('Failed to parse questions from AI response');
    }
    
    const questions = JSON.parse(jsonMatch[0]);
    
    console.log(`Extracted ${questions.length} questions`);
    
    return res.status(200).json({ 
      success: true,
      questions: questions,
      count: questions.length
    });
    
  } catch (error) {
    console.error('Extraction error:', error);
    return res.status(500).json({ 
      success: false,
      error: error.message,
      details: error.toString()
    });
  }
}
