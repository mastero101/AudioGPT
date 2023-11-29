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

  async sendAudioToOpenAI(audioFilePath: string): Promise<string> {
    try {
      const formData = new FormData();
      const stream = await this.readFileAsArrayBuffer(audioFilePath);
      formData.append('file', new Blob([stream]), 'audio_input.wav');
      formData.append('model', 'whisper-1');
      formData.append('language', 'es');

      const response: AxiosResponse = await axios.post('https://api.openai.com/v1/audio/transcriptions', formData, {
        headers: {
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

      return openAiResponse.data.choices[0].message.content;
    } catch (error: any) {
      console.error('Error al enviar datos de audio a OpenAI:', error.message);
      throw error;
    }
  }

  private readFileAsArrayBuffer(filePath: string): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target && event.target.result) {
          resolve(event.target.result as ArrayBuffer);
        } else {
          reject(new Error('Error al leer el archivo como ArrayBuffer'));
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsArrayBuffer(new Blob([filePath]));
    });
  }

  playAudio(audioFilePath: string): void {
    const sound = new Howl({
      src: [audioFilePath],
      format: ['wav'], // Ajusta el formato según sea necesario
    });

    sound.play();
  }

  async saveAudio(audioBlob: Blob): Promise<string> {
    try {
      const uniqueFileName = `${new Date().toISOString()}.wav`;
      const audioFilePath = `assets/audio/${uniqueFileName}`;
  
      // Devuelve la ruta relativa desde la raíz de la aplicación
      return audioFilePath;
    } catch (error: any) {
      console.error('Error al guardar el archivo de audio:', error.message);
      throw error;
    }
  }
}
