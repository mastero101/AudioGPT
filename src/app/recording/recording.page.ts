import { Component } from '@angular/core';
import { OpeniaService } from '../openia.service';

import { ChangeDetectorRef } from '@angular/core';

import { NgZone } from '@angular/core';

@Component({
  selector: 'app-recording',
  templateUrl: './recording.page.html',
  styleUrls: ['./recording.page.scss'],
})
export class RecordingPage {
  private mediaRecorder!: MediaRecorder;
  private audioChunks: Blob[] = [];
  isRecording = false;
  isLoading = false;
  audioFile: string | null = null;
  chatMessages: { role: string, content: string }[] = [];

  transcriptionRole = 'Me';
  gptRole = 'GPT';

  constructor(
      private openiaService: OpeniaService, 
      private cdr: ChangeDetectorRef,
      private ngZone: NgZone
    ) {}

  async startRecording() {
    this.isLoading = true;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Reiniciamos audioChunks al inicio de una nueva grabación
      this.audioChunks = [];

      this.mediaRecorder = new MediaRecorder(stream);

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });

        // Verificamos el tamaño y tipo del blob antes de enviarlo a OpenAI
        console.log('Tamaño del blob:', audioBlob.size);
        console.log('Tipo del blob:', audioBlob.type);

        try {
          // Ahora puedes enviar el blob a OpenAI
          const transcription = await this.openiaService.sendAudioToOpenAI(audioBlob);

          this.chatMessages.push({ role: 'Me', content: transcription });

          // Enviar la transcripción a OpenAI para obtener la respuesta de ChatGPT
          const response = await this.openiaService.sendTextToOpenAI(transcription);

          // Agregar tanto la transcripción como la respuesta al array chatMessages
          this.chatMessages.push({ role: 'GPT', content: response });
          this.isLoading = false;

          // Forzar la actualización de la vista dentro de la zona de Angular
          this.ngZone.run(() => {
            this.cdr.detectChanges();
          });
        } catch (error: any) {
          console.error('Error al enviar el archivo de audio a OpenAI:', error.message);
        } finally {
          // Finalizar la animación después de un tiempo de espera (por ejemplo, 2 segundos)
          setTimeout(() => {
            
          }, 2000);
        }
      };

      this.mediaRecorder.start();
      this.isRecording = true;
    } catch (error: any) {
      console.error('Error al iniciar la grabación:', error.message);
    }
  }
  
  async stopRecording() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.isRecording = false;
       // Asegurarse de que isLoading se restablece al detener la grabación
    }
  }

  async handleFileInputChange(event: any) {
    const file = event.target.files[0];

    if (file) {
      this.isLoading = true;

      try {
        const transcription = await this.openiaService.sendAudioFileToWhisper(file);

        this.chatMessages.push({ role: 'Me', content: transcription });

        // Enviar la transcripción a OpenAI para obtener la respuesta de ChatGPT
        const response = await this.openiaService.sendTextToOpenAI(transcription);

        // Agregar tanto la transcripción como la respuesta al array chatMessages
        this.chatMessages.push({ role: 'GPT', content: response });
        this.isLoading = false;

        // Forzar la actualización de la vista dentro de la zona de Angular
        this.ngZone.run(() => {
          this.cdr.detectChanges();
        });
      } catch (error: any) {
        console.error('Error al enviar el archivo de audio a OpenAI:', error.message);
      }
    }
  }

  downloadLog() {
    const logText = this.chatMessages.map(msg => `${msg.role}: ${msg.content}`).join('\n');
    const blob = new Blob([logText], { type: 'text/plain' });

    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'chat_log.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}
