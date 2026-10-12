// Run the same pss-rules files in Node, through pssparser's WASM build.
import { readFileSync } from 'node:fs';
import { createParser } from '@psstools/pssparser';

const read = (f) => readFileSync(f, 'utf8');
const parser = await createParser();
parser.parseSources([{ name: 'dma_house.pss', content: read('dma_house.pss') }]);
parser.link();
parser.loadRules([
  { name: 'house_naming.yaml',  text: read('house_naming.yaml') },
  { name: 'memory_claims.yaml', text: read('memory_claims.yaml') },
]);
for (const m of parser.runLint().markers)
  console.log(`${m.file}:${m.line}:${m.col}: ${m.severity}: [${m.code}] ${m.message}`);
