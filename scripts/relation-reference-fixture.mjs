import {writeFile} from 'node:fs/promises';
import {estimationFixture} from './relation-fixtures.mjs';
import {relationEmbedding} from '../public/relationships.js';
const {dataset}=estimationFixture(77123,'contaminated',60,6),symbols=Object.keys(dataset).sort(),basket=symbols.map(s=>dataset[s]),representation=relationEmbedding(basket,symbols);
await writeFile('research/relationship-reference-input.json',JSON.stringify({symbols,closes:basket.map(rows=>rows.map(r=>r.close)),representation},null,2)+'\n');
