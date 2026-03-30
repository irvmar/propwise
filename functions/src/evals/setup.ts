import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

if (!process.env.ANTHROPIC_API_KEY) {
  console.warn(
    '\n⚠️  ANTHROPIC_API_KEY not set — live evals will be skipped.\n' +
    '   Copy functions/.env.example to functions/.env and add your key.\n',
  );
}
