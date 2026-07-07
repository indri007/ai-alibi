const axios = require('axios');

/**
 * Handler untuk ZeroGPT API via RapidAPI
 * Dokumentasi: https://rapidapi.com/zerogpt-zerogpt-default/api/zerogpt
 */
module.exports = async function zerogptHandler(text) {
  const apiKey = process.env.ZEROGPT_API_KEY;
  if (!apiKey) {
    throw new Error('ZEROGPT_API_KEY tidak dikonfigurasi di backend.');
  }

  try {
    const response = await axios.post(
      'https://zerogpt.p.rapidapi.com/api/v1/detectText',
      {
        text: text
      },
      {
        headers: {
          'content-type': 'application/json',
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': 'zerogpt.p.rapidapi.com'
        }
      }
    );

    const data = response.data.data;
    
    // Format output standard ZeroGPT
    return {
      is_gpt_generated: data.isHuman < 50 ? 100 : 0, // ZeroGPT mengembalikan isHuman, fakePercentage dll
      fake_percentage: data.fakePercentage,
      text_words: data.textWords,
      ai_words: data.aiWords,
      feedback: data.feedback
    };
  } catch (error) {
    // Tangani error dari axios
    if (error.response) {
      throw new Error(`ZeroGPT menolak request (${error.response.status}): ${JSON.stringify(error.response.data)}`);
    } else {
      throw new Error(`Koneksi ke ZeroGPT gagal: ${error.message}`);
    }
  }
};
