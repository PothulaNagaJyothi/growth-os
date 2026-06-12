// Azure OpenAI Service Integrator
const axios = require('axios');

class OpenAIService {
  constructor() {
    this.endpoint = process.env.AZURE_OPENAI_ENDPOINT;
    this.apiKey = process.env.AZURE_OPENAI_API_KEY;
    this.deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_NAME;
  }

  /**
   * Generates text completions via Azure OpenAI (GPT-5/gpt-5.4)
   * @param {Array} messages - Chat conversation messages: [{ role: 'system'|'user', content: '...' }]
   * @param {Object} options - Custom parameters (temperature, max_tokens, etc.)
   */
  async generateCompletion(messages, options = {}) {
    try {
      if (!this.apiKey || !this.endpoint) {
        throw new Error('Azure OpenAI credentials are missing from the environment configuration.');
      }

      // Format URL for Azure OpenAI API
      const apiVersion = '2023-05-15'; // Standard stable api-version for completions
      const url = `${this.endpoint}/openai/deployments/${this.deploymentName}/chat/completions?api-version=${apiVersion}`;

      const requestData = {
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.max_tokens ?? 2000,
        ...options,
      };

      try {
        const response = await axios.post(
          url,
          requestData,
          {
            headers: {
              'Content-Type': 'application/json',
              'api-key': this.apiKey,
            },
          }
        );
        return response.data.choices[0].message.content;
      } catch (error) {
        const errMsg = error.response?.data?.error?.message || error.message || '';
        if (errMsg.includes("Unsupported parameter: 'max_tokens'") && requestData.max_tokens) {
          console.log('[AI SERVICE] Sourced modern model deployment. Retrying using max_completion_tokens...');
          const { max_tokens, ...rest } = requestData;
          rest.max_completion_tokens = max_tokens;
          // Modern reasoning models like o1/o3 do not support temperature parameters
          delete rest.temperature;
          const retryResponse = await axios.post(
            url,
            rest,
            {
              headers: {
                'Content-Type': 'application/json',
                'api-key': this.apiKey,
              },
            }
          );
          return retryResponse.data.choices[0].message.content;
        }
        throw error;
      }
    } catch (error) {
      console.error('Azure OpenAI Generation Error:', error.response?.data || error.message);
      throw new Error(`AI synthesis failed: ${error.response?.data?.error?.message || error.message}`);
    }
  }
}

module.exports = new OpenAIService();
