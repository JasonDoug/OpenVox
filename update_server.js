const fs = require('fs');

const apPath = './server/src/audioProcessor.ts';
let ap = fs.readFileSync(apPath, 'utf8');
ap = ap.replace(
  'processAudio(audioData: number[]): number[] {',
  'async processAudio(audioData: number[]): Promise<number[]> {'
);
ap = ap.replace(
  'return this.runInference(float32Data);',
  'return await this.runInference(float32Data);'
);
fs.writeFileSync(apPath, ap);

const indexPath = './server/src/index.ts';
let index = fs.readFileSync(indexPath, 'utf8');
index = index.replace(
  'const processedData = audioProcessor.processAudio(audioData);',
  'const processedData = await audioProcessor.processAudio(audioData);'
);
fs.writeFileSync(indexPath, index);
console.log('Server files updated');
