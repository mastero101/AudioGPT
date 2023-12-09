// openia.service.ts

import { Injectable } from '@angular/core';
import axios, { AxiosResponse } from 'axios';
import { Howl } from 'howler';

import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class OpeniaService {
  private openaiApiKey!: string;

  constructor() {
    this.loadEnv();
  }

  private loadEnv() {
    this.openaiApiKey = environment.openaiApiKey || '';
  }

  async sendAudioToOpenAI(audioBlob: Blob): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio_input.wav');
      formData.append('model', 'whisper-1');
      formData.append('language', 'es');
  
      const response: AxiosResponse = await axios.post('https://api.openai.com/v1/audio/transcriptions', formData, {
        headers: {
          'Content-Type': 'multipart/form-data', // Asegúrate de incluir este encabezado
          'Authorization': `Bearer ${this.openaiApiKey}`,
        },
      });
  
      console.log('Transcripcion:', response.data.text);
      
      return response.data.text;
    } catch (error: any) {
      console.error('Error al enviar datos de audio a OpenAI:', error.message);
      throw error;
    }
  }

  async sendTextToOpenAI(text: string): Promise<string> {
    try {
      const openAiResponse: AxiosResponse = await axios.post('https://api.openai.com/v1/chat/completions', {
        messages: [{ role: 'user', content: text }],
        model: 'gpt-3.5-turbo',
        max_tokens: 300,
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.openaiApiKey}`,
        },
      });

      const generatedText = openAiResponse.data.choices[0].message.content;

      console.log('Respuesta de OpenAI:', generatedText);

      // Generar voz a partir del texto
      await this.reciveAudioFromOpenAI(generatedText);
  
      return generatedText;
    } catch (error: any) {
      console.error('Error al enviar datos de audio a OpenAI:', error.message);
      throw error;
    }
  }

  async reciveAudioFromOpenAI(text: string): Promise<void> {
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/audio/speech',
        {
          model: 'tts-1',
          voice: 'onyx',
          input: text,
        },
        {
          headers: {
            Authorization: `Bearer ${this.openaiApiKey}`,
            'Content-Type': 'application/json',
          },
          responseType: 'arraybuffer',
        }
      );
  
      const buffer = new Uint8Array(response.data);
      const audioBlob = new Blob([buffer], { type: 'audio/wav' });

      // Reproducir el audio
      this.playAudioBlob(audioBlob);

      console.log('Speech generated successfully');
    } catch (error: any) {
      console.error('Error generating speech:', error.message);
      throw error;
    }
  }

  async sendAudioFileToWhisper(audioFile: File): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('file', audioFile);
      formData.append('model', 'whisper-1');
      formData.append('language', 'es');
  
      const response: AxiosResponse = await axios.post('https://api.openai.com/v1/audio/transcriptions', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${this.openaiApiKey}`,
        },
      });
  
      console.log('Transcripcion:', response.data.text);
      
      return response.data.text;
    } catch (error: any) {
      console.error('Error al enviar datos de audio a OpenAI:', error.message);
      throw error;
    }
  }

  playAudioBlob(audioBlob: Blob): void {
    const sound = new Howl({
      src: [URL.createObjectURL(audioBlob)],
      format: ['wav'], // Ajusta el formato según sea necesario
    });

    sound.play();
  }

}
