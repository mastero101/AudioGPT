import { Component } from '@angular/core';
import { OpeniaService } from '../openia.service';

@Component({
  selector: 'app-recording',
  templateUrl: './recording.page.html',
  styleUrls: ['./recording.page.scss'],
})
export class RecordingPage {
  private mediaRecorder!: MediaRecorder;
  private audioChunks: Blob[] = [];
  isRecording = false;
  audioFile: string | null = null;

  constructor(private openiaService: OpeniaService) {}

  async startRecording() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    this.mediaRecorder = new MediaRecorder(stream);

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.audioChunks.push(event.data);
      }
    };

    this.mediaRecorder.onstop = () => {
      const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
      // Ahora puedes guardar o enviar este Blob a tu servicio de OpenAI
      console.log('Grabación completada:', audioBlob);
    };

    this.mediaRecorder.start();
    this.isRecording = true;
  }

  async stopRecording() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.isRecording = false;
  
      const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
  
      try {
        // Guardar el archivo de audio
        const audioFilePath = await this.openiaService.saveAudio(audioBlob);
  
        // Enviar la ruta del archivo de audio a OpenAI
        const transcription = await this.openiaService.sendAudioToOpenAI(audioFilePath);
        console.log('Transcripción completa:', transcription);
  
        // Puedes asignar la ruta del archivo a this.audioFile si es necesario
        this.audioFile = audioFilePath;
      } catch (error: any) {
        console.error('Error al enviar el archivo de audio a OpenAI:', error.message);
      }
    }
  }

  async playLastRecording() {
    if (this.audioFile) {
      this.openiaService.playAudio(this.audioFile); // Utiliza tu función playAudio
    }
  }
}
