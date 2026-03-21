export type License = 'MIT' | 'Apache-2.0';

export interface ProjectResource {
  label: string;
  url: string;
  type: 'zip' | 'pdf';
  license?: License;
  licenseUrl?: string;
}

export interface Project {
  id: string;
  title: string;
  context?: string;
  objective?: string;
  description: string;
  value?: string;
  resources: ProjectResource[];
}

const LICENSE_URLS: Record<License, string> = {
  'MIT': 'https://opensource.org/license/mit',
  'Apache-2.0': 'https://www.apache.org/licenses/LICENSE-2.0',
};

export const projects: Project[] = [
  {
    id: 'cybersecurity-ai',
    title: 'Problemas de ciberseguridad con IA (seguridad conceptual)',
    context:
      'La IA modifica el panorama de riesgos en sistemas de información.',
    objective:
      'Aplicar principios de seguridad para analizar amenazas cuando la IA participa en el tratamiento de datos.',
    description:
      'Desarrollo de casos, modelos conceptuales y herramientas didácticas para enseñar cómo cambian la confidencialidad, integridad y disponibilidad cuando intervienen sistemas de IA.',
    value:
      'Construcción de criterio profesional basado en fundamentos sólidos, no en modas tecnológicas.',
    resources: [],
  },
  {
    id: 'framework-ag',
    title: 'Framework para proyectos con Algoritmos Genéticos',
    description:
      'Framework en Java que organiza población, operadores, evaluación y monitoreo. Permite comparar variantes, ajustar parámetros y desarrollar proyectos completos y replicables.',
    resources: [
      {
        label: 'Descargar FrameworkAG-1.0.zip',
        url: 'https://drive.google.com/file/d/1K9HCjpfXLfoSpgz7KnN1zw9dr19yvFCF/view?usp=drive_link',
        type: 'zip',
        license: 'Apache-2.0',
        licenseUrl: LICENSE_URLS['Apache-2.0'],
      },
      {
        label: 'Ver documentación (PDF)',
        url: 'https://drive.google.com/file/d/1wNAWdJb_52JP0FhVeX1uMH8Tm8yR3Ea8/view?usp=drive_link',
        type: 'pdf',
        license: 'Apache-2.0',
        licenseUrl: LICENSE_URLS['Apache-2.0'],
      },
    ],
  },
  {
    id: 'tsp-ag',
    title: 'TSP con Algoritmos Genéticos',
    description:
      'Implementación del TSP usando el framework. Permite visualizar rutas, estudiar convergencia e interpretar cómo los parámetros afectan el rendimiento del algoritmo.',
    resources: [
      {
        label: 'Descargar AgenteViajeroAG-1.0.zip',
        url: 'https://drive.google.com/file/d/1m8kxXVKyQn27m3-G-qfnajxFxxEPqLjt/view?usp=drive_link',
        type: 'zip',
        license: 'MIT',
        licenseUrl: LICENSE_URLS['MIT'],
      },
    ],
  },
  {
    id: 'tsp-aco',
    title: 'TSP con Algoritmo de Colonia de Hormigas',
    description:
      'Implementación completa del ACO con representación de feromonas y visualización de rutas. Comparación directa con AG para comprender fortalezas y debilidades de cada enfoque.',
    resources: [
      {
        label: 'Descargar AgenteViajeroACO-1.0.zip',
        url: 'https://drive.google.com/file/d/1tKD95KeieMbaR-WyzYteKqU4r7giOZ2w/view?usp=drive_link',
        type: 'zip',
        license: 'MIT',
        licenseUrl: LICENSE_URLS['MIT'],
      },
    ],
  },
  {
    id: 'automation-infra',
    title: 'Automatización con n8n y administración con TrueNAS Scale',
    description:
      'Automatización: workflows para monitoreo, registros, alertas, respaldos y tareas académicas. Infraestructura: configuración completa de un NAS con TrueNAS Scale: ZFS, datasets, snapshots, Cloud Sync, servicios integrados.',
    value:
      'Un entorno moderno, estable y reproducible para apoyar docencia, proyectos y gestión académica.',
    resources: [],
  },
];

export const projectsIntro =
  'Mis proyectos combinan IA clásica, seguridad conceptual, automatización y administración de sistemas. Están diseñados para enseñar, documentar y resolver problemas contemporáneos con rigor y claridad.';
