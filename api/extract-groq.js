export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { pdfText } = req.body;
    
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
          content: `Extract all exam questions from this text as JSON array.

${pdfText.substring(0, 20000)}

Return format: [{"question_number":1,"section":"Reasoning","question_text":"...","options":["A","B","C","D"],"correct_option_index":0,"has_marked_answer":false,"has_diagram":false}]

Return ONLY JSON, no other text.`
        }],
        temperature: 0.1,
        max_tokens: 4000
      })
    });

    const data = await response.json();
    const text = data.choices[0].message.content;
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    const questions = JSON.parse(jsonMatch[0]);
    
    return res.status(200).json({ questions });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
