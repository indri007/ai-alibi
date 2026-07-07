const axios = require('axios');

/**
 * Handler untuk GPTZero API
 * Dokumentasi: https://gptzero.me/docs
 */
module.exports = async function gptzeroHandler(text) {
  const apiKey = process.env.GPTZERO_API_KEY;
  if (!apiKey) {
    throw new Error('GPTZERO_API_KEY tidak dikonfigurasi di backend.');
  }

  try {
    const response = await axios.post(
      'https://api.gptzero.me/v2/predict/text',
      {
        document: text,
        multilingual: true
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey
        }
      }
    );

    // Format output standard API GPTZero v2
    const data = response.data.documents[0];
    
    return {
      completely_generated_prob: data.completely_generated_prob,
      average_generated_prob: data.average_generated_prob,
      class_label: data.class_label,
      sentences: data.sentences
    };
  } catch (error) {
    // Tangani error dari axios
    if (error.response) {
      throw new Error(`GPTZero menolak request (${error.response.status}): ${JSON.stringify(error.response.data)}`);
    } else {
      throw new Error(`Koneksi ke GPTZero gagal: ${error.message}`);
    }
  }
};
