import { config as dotenvConfig } from 'dotenv';
import path from 'path';
dotenvConfig({ path: path.resolve(__dirname, '../../../.env') });

import { db } from './index';
import { publications } from './schema';

const data = [
  {
    type: 'Artículo' as const,
    title: 'La disyuntiva de la educación universitaria',
    publishedAt: new Date('2025-11-01'),
    storageLink: 'https://drive.google.com/file/d/19HCm1Oo79Lqym1iyt3j4sQc41RUtrLeg/view?usp=drive_link',
  },
  {
    type: 'Blog' as const,
    title: 'Cómo hablar con la IA - El arte del Prompt',
    publishedAt: new Date('2025-07-01'),
    storageLink: 'https://drive.google.com/file/d/1RP44W8YOKZZIgBKylkdOcnbokQwmb_r5/view?usp=drive_link',
  },
  {
    type: 'Artículo' as const,
    title: 'Actualización y marco de referencia de los nuevos paradigmas en Ingeniería de Sistemas',
    publishedAt: new Date('2019-03-01'),
    storageLink: 'https://drive.google.com/file/d/1WWovcm0-gzHQnotiKxscE327Dsokmqhc/view?usp=drive_link',
  },
  {
    type: 'Artículo' as const,
    title: 'Uso de los servicios en la nube como herramienta de enseñanza-aprendizaje',
    publishedAt: new Date('2018-03-01'),
    storageLink: 'https://drive.google.com/file/d/1hRN0zxrsk-vqqg_19ItUNeBJwM7regSc/view?usp=drive_link',
  },
  {
    type: 'Artículo' as const,
    title: 'Redes inalámbricas de datos - nuestra realidad',
    publishedAt: new Date('2007-09-01'),
    storageLink: 'https://drive.google.com/file/d/1iPOdLiI4QV1IHaz82iDfBETji15-joeI/view?usp=drive_link',
  },
];

async function seed() {
  console.log('Insertando publicaciones...');
  for (const pub of data) {
    await db.insert(publications).values(pub);
    console.log(`  ✓ ${pub.title.slice(0, 60)}...`);
  }
  console.log('Listo.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Error en seed:', err);
  process.exit(1);
});
