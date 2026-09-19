import { ToolItem } from '../types';

export interface HowToStep {
  step: number;
  title: string;
  description: string;
}

export function getToolHowToSteps(tool: ToolItem): HowToStep[] {
  const slug = tool.slug;

  // Specific custom steps for key tools
  const customSteps: Record<string, HowToStep[]> = {
    'merge-pdf': [
      { step: 1, title: 'Select PDF Documents', description: 'Click choose files or drag and drop multiple PDF documents from your device.' },
      { step: 2, title: 'Arrange Page Order', description: 'Drag and reorder document cards or individual pages into your desired reading sequence.' },
      { step: 3, title: 'Merge & Save', description: 'Click "Merge PDF" to combine all pages locally in your browser and download the unified document instantly.' }
    ],
    'split-pdf': [
      { step: 1, title: 'Upload Your PDF', description: 'Select the PDF document you wish to divide from your local computer or phone.' },
      { step: 2, title: 'Specify Page Ranges', description: 'Enter exact page ranges (e.g. 1-3, 5, 8-12) or click page thumbnails to select pages to extract.' },
      { step: 3, title: 'Extract Pages', description: 'Generate your new focused PDF file and download it with zero server transmission.' }
    ],
    'rotate-pdf': [
      { step: 1, title: 'Select PDF File', description: 'Choose any PDF with inverted or landscape-oriented pages.' },
      { step: 2, title: 'Choose Rotation Angle', description: 'Click clockwise or counter-clockwise (90°, 180°, 270°) on all pages or specific sheets.' },
      { step: 3, title: 'Download Fixed PDF', description: 'Save the permanently re-oriented PDF document directly to your device.' }
    ],
    'image-to-pdf': [
      { step: 1, title: 'Choose Images', description: 'Select one or more JPG, PNG, or WebP images to convert.' },
      { step: 2, title: 'Configure Page Layout', description: 'Choose orientation (Portrait/Landscape), page size (A4, Letter, Fit), and margin padding.' },
      { step: 3, title: 'Generate PDF', description: 'Click Convert to assemble your images into a clean, print-ready PDF document.' }
    ],
    'compress-pdf': [
      { step: 1, title: 'Select Heavy PDF', description: 'Drop any oversized PDF document you want to optimize for email or web.' },
      { step: 2, title: 'Select Compression Level', description: 'Choose between Extreme, Recommended, or Light compression settings.' },
      { step: 3, title: 'Download Compressed File', description: 'Inspect the reduced file size and save the optimized document with crisp text preserved.' }
    ],
    'image-compressor': [
      { step: 1, title: 'Select Photos', description: 'Drop or select JPG, PNG, or WebP images from your device.' },
      { step: 2, title: 'Adjust Quality Slider', description: 'Tune the visual quality slider while previewing file size savings in real time.' },
      { step: 3, title: 'Save Optimized Image', description: 'Download your compressed image individually or as a bulk ZIP archive.' }
    ],
    'image-converter': [
      { step: 1, title: 'Add Source Images', description: 'Choose the graphic files you need to convert.' },
      { step: 2, title: 'Select Target Format', description: 'Pick your desired output: PNG, JPG, WebP, AVIF, or BMP.' },
      { step: 3, title: 'Convert Instantly', description: 'Process the conversion in browser memory and save the transcoded files immediately.' }
    ],
    'json-formatter': [
      { step: 1, title: 'Paste Raw JSON', description: 'Paste unformatted JSON text or drop a `.json` configuration file.' },
      { step: 2, title: 'Validate & Indent', description: 'Select 2 spaces, 4 spaces, or compact minify. Automatic syntax checks will highlight errors.' },
      { step: 3, title: 'Copy or Download', description: 'Click copy to clipboard or download the beautified JSON file.' }
    ],
    'qr-code-generator': [
      { step: 1, title: 'Enter Content', description: 'Type or paste a website URL, plaintext message, or Wi-Fi network credentials.' },
      { step: 2, title: 'Customize Styling', description: 'Select foreground and background colors and adjust error correction tolerance.' },
      { step: 3, title: 'Download QR Code', description: 'Download high-resolution PNG for digital screens or vector SVG for printing.' }
    ],
    'word-counter': [
      { step: 1, title: 'Input Text', description: 'Type or paste your article, essay, or snippet into the editor.' },
      { step: 2, title: 'Inspect Live Metrics', description: 'Review real-time calculations for words, characters, sentences, paragraphs, and reading time.' },
      { step: 3, title: 'Export or Copy', description: 'Copy text statistics or clear the canvas for your next draft.' }
    ],
    'password-generator': [
      { step: 1, title: 'Set Desired Length', description: 'Select your target password length from 8 up to 64 characters.' },
      { step: 2, title: 'Choose Character Sets', description: 'Toggle uppercase letters, lowercase letters, numbers, and special symbols.' },
      { step: 3, title: 'Copy Secure Password', description: 'Generate high-entropy cryptographic strings and copy them directly to your clipboard.' }
    ]
  };

  if (customSteps[slug]) {
    return customSteps[slug];
  }

  // Fallback 4-step workflow derived from tool description
  return [
    {
      step: 1,
      title: 'Load or Input Data',
      description: `Select your input files or enter your data into ${tool.name}. Everything stays strictly on your local device.`
    },
    {
      step: 2,
      title: 'Configure Settings',
      description: 'Customize output options, preview adjustments, and tune parameters to suit your exact needs.'
    },
    {
      step: 3,
      title: 'Execute Client-Side Engine',
      description: 'The operation runs 100% inside your browser memory without transmitting bytes to external servers.'
    },
    {
      step: 4,
      title: 'Save or Copy Result',
      description: 'Download your finalized file or copy the result to your clipboard with no waitlists or limits.'
    }
  ];
}
