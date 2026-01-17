export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

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
          content: `Extract ALL exam questions from this text as JSON array.

${pdfText}

Return format:
[{"question_number":1,"section":"Reasoning","question_text":"...","options":["A","B","C","D"],"correct_option_index":0}]

Return ONLY valid JSON, no other text.`
        }],
        temperature: 0.1,
        max_tokens: 6000
      })
    });

    if (!response.ok) throw new Error('Groq API failed');

    const data = await response.json();
    let text = data.choices[0].message.content.trim();
    text = text.replace(/```json\s*/g, '').replace(/```/g, '');
    
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error('No JSON found');
    
    const questions = JSON.parse(jsonMatch[0]);
    
    return res.status(200).json({ success: true, questions });
    
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
