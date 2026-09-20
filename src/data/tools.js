/**
 * ToolGenie - Complete Tools & Category Dataset
 * All processing is strictly 100% client-side.
 */

export const categories = [
  {
    name: "PDF Tools",
    slug: "pdf-tools",
    accentColor: "#ef4444",
    status: "live",
    description: "Combine, split, compress, and manipulate PDF documents entirely within your browser.",
    tools: [
      {
        name: "Merge PDF",
        slug: "merge-pdf",
        icon: "FileStack",
        shortDescription: "Combine multiple PDF documents into a single organized file.",
        longDescription: "Easily merge two or more PDF files into a single unified document with custom drag-and-drop page ordering. Runs 100% client-side with zero data transmission to external servers.",
        status: "live",
        faqs: [
          { q: "Are my PDF files uploaded to any server?", a: "No. All PDF merging happens directly inside your web browser using WebAssembly. Your files never touch a remote server." },
          { q: "Is there a limit on file size or number of files?", a: "Because processing uses your local device memory, you can merge as many documents as your browser memory allows with no artificial caps." },
          { q: "Can I reorder the pages before combining?", a: "Yes, you can rearrange documents or individual pages in any sequence before generating the final combined PDF." },
          { q: "Does merging PDFs reduce the quality of embedded images?", a: "No, original document vector elements, text layers, and image resolutions are preserved without lossy recompression." },
          { q: "Will password-protected PDFs work?", a: "You will be prompted to enter the password in your browser to unlock the document before combining." },
          { q: "Can I use this tool on a mobile device?", a: "Yes, modern mobile browsers on iOS and Android can run the client-side PDF engine seamlessly." }
        ]
      },
      {
        name: "Split PDF",
        slug: "split-pdf",
        icon: "Scissors",
        shortDescription: "Extract specific page ranges or split single pages into new PDFs.",
        longDescription: "Divide large PDF files into distinct chapters or extract isolated pages with precise page range selectors and instant previews.",
        status: "live",
        faqs: [
          { q: "How do I specify which pages to extract?", a: "You can enter custom ranges like '1-5, 8, 11-14' or click page thumbnails directly to select what to keep." },
          { q: "Does splitting PDFs leak confidential text?", a: "Never. The split operations take place in client sandboxes without any internet transmission." },
          { q: "Can I split a PDF into separate single-page files?", a: "Yes, you can batch split an entire document into individual single-page documents bundled in a ZIP." },
          { q: "Does the extracted file retain bookmarks and hyperlinks?", a: "Yes, internal page references and external links belonging to extracted pages remain active." },
          { q: "Is this tool free forever?", a: "Yes, ToolGenie tools are completely free with zero subscription requirements or watermarks." }
        ]
      },
      {
        name: "Rotate PDF",
        slug: "rotate-pdf",
        icon: "RotateCw",
        shortDescription: "Permanently rotate individual pages or entire PDF orientations.",
        longDescription: "Fix upside-down or sideways pages in your PDF documents. Rotate selected pages 90, 180, or 270 degrees clockwise with immediate layout persistence.",
        status: "live",
        faqs: [
          { q: "Can I rotate only specific pages in a document?", a: "Yes, you can choose to rotate all pages or select only individual odd or even pages." },
          { q: "Is the rotation permanent when I download?", a: "Yes, the orientation metadata and page bounding boxes are permanently saved in the output file." },
          { q: "Does rotating modify the text content or layout?", a: "No, vector fonts, layouts, and annotations remain intact; only the page display angle changes." },
          { q: "How fast is client-side PDF rotation?", a: "Because no upload or download latency exists, the operation completes in milliseconds on your device." },
          { q: "Can I rotate scanned document pages?", a: "Yes, scanned pages are rotated cleanly without raster artifacting." }
        ]
      },
      {
        name: "Image to PDF",
        slug: "image-to-pdf",
        icon: "ImagePlus",
        shortDescription: "Convert JPG, PNG, and WebP images into a standardized PDF.",
        longDescription: "Assemble photos, receipts, or document scans into a pristine, high-resolution PDF document with configurable margins and orientations.",
        status: "live",
        faqs: [
          { q: "Which image formats can I convert to PDF?", a: "We support PNG, JPEG, WebP, SVG, BMP, and GIF image files." },
          { q: "Can I adjust margins and page sizes?", a: "Yes, choose from standard A4, US Letter, or fit-to-image dimensions with tight, standard, or zero margins." },
          { q: "Can I combine multiple pictures into one PDF book?", a: "Yes, upload multiple images simultaneously and reorder them into a cohesive multi-page file." },
          { q: "Does it compress or degrade image quality?", a: "You can select lossless mode to preserve 100% original pixel density or pick optimized compression." },
          { q: "Does this require an internet connection once loaded?", a: "No, once the page is cached in your browser, it works completely offline." }
        ]
      },
      {
        name: "Compress PDF",
        slug: "compress-pdf",
        icon: "Minimize2",
        shortDescription: "Reduce PDF file sizes while maintaining sharp readability.",
        longDescription: "Shrink heavy PDF files for email attachments and portal uploads by optimizing embedded images and pruning redundant metadata without server reliance.",
        status: "live",
        faqs: [
          { q: "How does browser-based compression work?", a: "The client-side engine downsamples heavy embedded raster images and removes unneeded PDF object streams." },
          { q: "Will text remain vector-sharp and searchable?", a: "Yes, all vector text layers and fonts are preserved, allowing full searchability and crisp typography." },
          { q: "What compression levels are available?", a: "Choose between Extreme (maximum reduction), Recommended (balanced), and High Quality (minimal image downsampling)." },
          { q: "How much file size can typically be reduced?", a: "Documents with high-resolution scanned graphics often shrink by 40% to 80%." },
          { q: "Are financial or legal documents safe to compress?", a: "Yes, 100% private. Since no file bytes ever leave your hardware, client confidentiality is guaranteed." }
        ]
      }
    ]
  },
  {
    name: "Image Tools",
    slug: "image-tools",
    accentColor: "#3b82f6",
    status: "live",
    description: "Optimize, resize, crop, and convert photos and graphics directly on your machine.",
    tools: [
      {
        name: "Image Compressor",
        slug: "image-compressor",
        icon: "FileDown",
        shortDescription: "Compress JPG, PNG, and WebP images with instant visual comparison.",
        longDescription: "Reduce image file sizes by up to 90% without visible loss in fidelity using modern Canvas and WebCodecs technology.",
        status: "live",
        faqs: [
          { q: "How does the in-browser image compressor work?", a: "It uses modern HTML5 Canvas, WebAssembly, and native browser codecs to optimize quantization tables locally." },
          { q: "Can I see a side-by-side comparison before downloading?", a: "Yes, you can toggle or slide between the original and compressed image to inspect visual fidelity." },
          { q: "Does compression strip EXIF metadata?", a: "You have full control to strip GPS and camera metadata for privacy or preserve color profiles." },
          { q: "Is batch image compression supported?", a: "Yes, you can drop multiple images and download them individually or in a unified ZIP archive." },
          { q: "Are animated GIFs or WebPs supported?", a: "Yes, static and animated image formats can be optimized." }
        ]
      },
      {
        name: "Image Converter",
        slug: "image-converter",
        icon: "RefreshCw",
        shortDescription: "Convert between PNG, JPG, WebP, AVIF, BMP, and SVG formats.",
        longDescription: "Transcode graphic formats in a split second. Convert legacy PNGs and JPEGs into high-efficiency modern WebP or AVIF files.",
        status: "live",
        faqs: [
          { q: "What formats are supported for conversion?", a: "You can convert between PNG, JPEG, WebP, AVIF, BMP, and SVG formats." },
          { q: "Does converting PNG to JPEG remove transparency?", a: "JPEG does not support alpha transparency, so transparent areas are filled with your choice of background color." },
          { q: "Can I convert WebP files back to JPG or PNG?", a: "Yes, WebP images can be easily decoded and converted to universally compatible PNG or JPG." },
          { q: "Is conversion lossy or lossless?", a: "You can select 100% lossless output for formats that support it, or tune quality sliders." },
          { q: "How many images can I convert at once?", a: "You can convert dozens of images simultaneously through client-side parallel web workers." }
        ]
      },
      {
        name: "Image Resizer",
        slug: "image-resizer",
        icon: "Maximize",
        shortDescription: "Resize pixel dimensions or scale images by percentage.",
        longDescription: "Scale down or up with high-quality bicubic and Lanczos resampling algorithms. Constrain aspect ratios or set exact pixel dimensions for social banners.",
        status: "live",
        faqs: [
          { q: "Can I resize by percentage or exact pixels?", a: "Both options are supported: enter target width/height or adjust a percentage slider." },
          { q: "Will the aspect ratio be maintained automatically?", a: "Yes, aspect ratio lock is enabled by default to prevent unwanted stretching or distortion." },
          { q: "Does it support preset social media dimensions?", a: "Yes, built-in quick presets are available for Instagram posts, YouTube thumbnails, and banner standards." },
          { q: "Can I resize photos taken on high-end DSLRs?", a: "Yes, even 50+ megapixel photos can be resized directly inside your browser." },
          { q: "What resampling filter does it use?", a: "High-grade Lanczos3 and bilinear algorithms are used to prevent pixelation and blur." }
        ]
      },
      {
        name: "Image Cropper",
        slug: "image-cropper",
        icon: "Crop",
        shortDescription: "Crop photos to custom dimensions or standard aspect ratios.",
        longDescription: "Trim unwanted edges, center subjects, and crop with predefined aspect ratios such as 1:1, 16:9, 4:3, or freeform framing.",
        status: "live",
        faqs: [
          { q: "Can I crop images into circles or squares?", a: "Yes, standard 1:1 squares, custom aspect ratios, and circular vignette previews are supported." },
          { q: "Does cropping reduce image resolution?", a: "The cropped area retains its exact original native resolution without unnecessary re-encoding loss." },
          { q: "Can I zoom in and rotate while cropping?", a: "Yes, you can zoom, pan, and fine-tune angles before locking in the crop boundary." },
          { q: "Can I undo or reset my crop boundary?", a: "Yes, you can reset to the original image canvas at any time before finalizing the export." },
          { q: "Do my images leave my device?", a: "Never. All cropping coordinates are rendered onto an internal canvas in your local browser." }
        ]
      },
      {
        name: "Watermark Image",
        slug: "watermark-image",
        icon: "Stamp",
        shortDescription: "Add custom text or logo watermarks to protect your photography.",
        longDescription: "Stamp copyright notices, logos, or signature watermarks across your photos with controllable opacity, rotation, tiling, and typography.",
        status: "live",
        faqs: [
          { q: "Can I use both text and graphic logos as watermarks?", a: "Yes, you can enter styled text or upload a transparent PNG logo." },
          { q: "Can I tile the watermark across the entire image?", a: "Yes, repeating tiled patterns prevent easy removal by unauthorized parties." },
          { q: "Can I adjust watermark transparency?", a: "Yes, an intuitive opacity slider lets you set subtle branding or bold protection." },
          { q: "Can I batch-watermark multiple photos at once?", a: "Yes, apply the exact same watermark settings across dozens of photos in one batch." },
          { q: "Are custom fonts supported?", a: "A variety of clean, modern typography styles are available for text watermarks." }
        ]
      }
    ]
  },
  {
    name: "Developer Tools",
    slug: "developer-tools",
    accentColor: "#10b981",
    status: "live",
    description: "Indispensable utilities for formatting, encoding, hashing, and debugging code.",
    tools: [
      {
        name: "JSON Formatter",
        slug: "json-formatter",
        icon: "Code2",
        shortDescription: "Validate, beautify, minify, and inspect JSON with syntax highlighting.",
        longDescription: "Format nested JSON payloads with customizable tab or space indentation, instant error detection with line numbers, and collapsible tree navigation.",
        status: "live",
        faqs: [
          { q: "Is my JSON data safe when testing sensitive API tokens?", a: "Yes! Everything runs client-side. No JSON payloads are ever transmitted across network sockets." },
          { q: "Does the validator point out exact syntax error locations?", a: "Yes, mismatched quotes, missing commas, or trailing symbols are highlighted with exact line and column indices." },
          { q: "Can I minify JSON for production use?", a: "Yes, toggle between 2-space, 4-space, tab indentation, or ultra-compact single-line minification." },
          { q: "Can I search or filter keys inside large JSON payloads?", a: "Yes, an integrated search bar lets you filter keys and values inside hierarchical trees." },
          { q: "Can I copy the formatted result with one click?", a: "Yes, quick-action copy buttons instantly place clean JSON into your clipboard." }
        ]
      },
      {
        name: "Base64 Encoder/Decoder",
        slug: "base64-encoder-decoder",
        icon: "Binary",
        shortDescription: "Encode and decode raw text, binary files, and data URLs.",
        longDescription: "Convert ASCII and Unicode text or file buffers to Base64 strings, or decode Base64 data back into clear readable strings and downloadable files.",
        status: "live",
        faqs: [
          { q: "Does it support UTF-8 and emoji characters?", a: "Yes, full Unicode support ensures multilingual characters and emojis encode and decode accurately." },
          { q: "Can I encode binary files like images and audio?", a: "Yes, upload any file to generate an inline Data URL (`data:image/png;base64,...`)." },
          { q: "Is URL-safe Base64 encoding supported?", a: "Yes, you can toggle standard Base64 (`+`, `/`) or URL-safe Base64 (`-`, `_`)." },
          { q: "Can I decode Base64 back into downloadable files?", a: "Yes, base64 strings containing binary data can be downloaded directly as files." },
          { q: "Is there any limit to the string length?", a: "Strings up to tens of megabytes are handled smoothly in modern browser memory." }
        ]
      },
      {
        name: "Hash Generator",
        slug: "hash-generator",
        icon: "Hash",
        shortDescription: "Compute cryptographic SHA-256, SHA-512, MD5, and SHA-1 hashes.",
        longDescription: "Generate secure cryptographic hashes for strings and files using the browser's hardware-accelerated Web Crypto API.",
        status: "live",
        faqs: [
          { q: "Which cryptographic hashing algorithms are supported?", a: "SHA-256, SHA-512, SHA-384, SHA-1, and MD5 are fully supported." },
          { q: "Does it utilize the native Web Crypto API?", a: "Yes, hashes are computed natively via `crypto.subtle` for optimal speed and cryptographical correctness." },
          { q: "Can I verify the integrity of a file before installing it?", a: "Yes, drop your downloaded file and compare the resulting checksum with the publisher's hash." },
          { q: "Are my passwords or keys sent to an external API?", a: "No, the calculations occur strictly in your local JavaScript runtime." },
          { q: "Can I output both lowercase and uppercase hex strings?", a: "Yes, toggle between lowercase, uppercase hex, or Base64 hash representations." }
        ]
      },
      {
        name: "QR Code Generator",
        slug: "qr-code-generator",
        icon: "QrCode",
        shortDescription: "Generate customizable QR codes for links, Wi-Fi, text, and vCards.",
        longDescription: "Create sharp vector SVG and high-res PNG QR codes with customizable colors, error correction levels, and embedded logo badges.",
        status: "live",
        faqs: [
          { q: "What types of data can I encode into a QR code?", a: "URLs, plaintext, Wi-Fi network credentials, email addresses, SMS, and vCard contact cards." },
          { q: "Can I customize the foreground and background colors?", a: "Yes, pick any color palette or match your brand styling." },
          { q: "What formats can I download the QR code in?", a: "Download as scalable vector SVG (ideal for printing) or PNG at resolutions up to 2048x2048." },
          { q: "What error correction levels are available?", a: "L (7%), M (15%), Q (25%), and H (30%) to ensure scan reliability even if partially damaged." },
          { q: "Do these QR codes ever expire?", a: "Never. These are direct static QR codes encoding the raw data directly into the matrix." }
        ]
      },
      {
        name: "Password Generator",
        slug: "password-generator",
        icon: "KeyRound",
        shortDescription: "Generate cryptographically secure, random passwords and passphrases.",
        longDescription: "Create uncrackable passwords using the browser's `crypto.getRandomValues()` entropy source, with custom length, symbol sets, and memorable passphrases.",
        status: "live",
        faqs: [
          { q: "How are the passwords randomized?", a: "Entropy is sourced directly from your operating system via the browser's `window.crypto.getRandomValues` engine." },
          { q: "Are passwords saved anywhere in the cloud?", a: "No. Passwords exist solely in your browser memory until you copy them." },
          { q: "Can I exclude confusing characters like 1, l, 0, and O?", a: "Yes, an 'Exclude ambiguous characters' switch prevents visual confusion." },
          { q: "Can I generate Diceware-style memorable passphrases?", a: "Yes, toggle between alphanumeric passwords and multi-word passphrases (e.g., `correct-horse-battery-staple`)." },
          { q: "Does it provide a password strength meter?", a: "Yes, real-time entropy calculation and brute-force time estimates are displayed." }
        ]
      }
    ]
  },
  {
    name: "Text Tools",
    slug: "text-tools",
    accentColor: "#f59e0b",
    status: "live",
    description: "Analyze, format, transform, and compare strings and long-form prose.",
    tools: [
      {
        name: "Word Counter",
        slug: "word-counter",
        icon: "FileText",
        shortDescription: "Count words, characters, sentences, paragraphs, and reading time.",
        longDescription: "Real-time text statistics calculator offering word counts, character counts (with/without spaces), reading time benchmarks, and keyword frequency density.",
        status: "live",
        faqs: [
          { q: "Does the word counter update as I type?", a: "Yes, metrics calculate live with every keystroke with zero delay." },
          { q: "How is estimated reading time calculated?", a: "Based on standard adult silent reading benchmarks of 200–250 words per minute." },
          { q: "Can I see character counts excluding spaces?", a: "Yes, both total characters and non-whitespace character counts are presented side-by-side." },
          { q: "Does it track sentence and paragraph count?", a: "Yes, structural paragraph breaks and punctuation-delimited sentences are tallied." },
          { q: "Is there a limit on text length?", a: "You can paste entire novel manuscripts with tens of thousands of words without slowdown." }
        ]
      },
      {
        name: "Case Converter",
        slug: "case-converter",
        icon: "CaseSensitive",
        shortDescription: "Transform text between camelCase, snake_case, UPPERCASE, and more.",
        longDescription: "Switch any sentence or code identifier across Sentence case, Title Case, UPPERCASE, lowercase, camelCase, PascalCase, snake_case, and kebab-case.",
        status: "live",
        faqs: [
          { q: "Which casing formats are supported?", a: "Sentence case, Title Case, UPPERCASE, lowercase, camelCase, PascalCase, snake_case, kebab-case, and alternating cAsE." },
          { q: "Can I convert developer code variables?", a: "Yes, converting between camelCase, snake_case, and kebab-case is ideal for programming workflows." },
          { q: "Does Title Case follow standard grammatical style guides?", a: "Yes, minor words like articles, conjunctions, and short prepositions are properly kept lowercase." },
          { q: "Can I copy the converted text instantly?", a: "Yes, a dedicated copy button places the transformed text directly on your clipboard." },
          { q: "Does it support international accented letters?", a: "Yes, Unicode diacritics and accented characters are preserved correctly." }
        ]
      },
      {
        name: "Lorem Ipsum Generator",
        slug: "lorem-ipsum-generator",
        icon: "Pilcrow",
        shortDescription: "Generate placeholder filler text by paragraphs, sentences, or words.",
        longDescription: "Produce classic Cicero Latin placeholder text or modern thematic variations to test visual designs, prototypes, and typography layouts.",
        status: "live",
        faqs: [
          { q: "Can I choose between paragraphs, sentences, or words?", a: "Yes, select the exact unit of measurement and quantity you need." },
          { q: "Can I wrap paragraphs in HTML `<p>` tags automatically?", a: "Yes, an optional switch wraps generated text in standard HTML tags for web design." },
          { q: "Can I guarantee starting with 'Lorem ipsum dolor sit amet'?", a: "Yes, a toggle lets you include or omit the traditional opening phrase." },
          { q: "Is the generated text royalty-free?", a: "Yes, all generated placeholder text is 100% public domain and free for commercial use." },
          { q: "How quickly can I generate 50 paragraphs?", a: "Instantaneously, generated purely in-memory in less than a millisecond." }
        ]
      },
      {
        name: "Text Diff Checker",
        slug: "text-diff-checker",
        icon: "GitCompare",
        shortDescription: "Compare two blocks of text side-by-side with color-coded diffs.",
        longDescription: "Identify additions, deletions, and subtle word-level modifications between two text versions with synchronized scrolling and side-by-side comparison.",
        status: "live",
        faqs: [
          { q: "How are text differences highlighted?", a: "Additions are highlighted in green, deletions in red, and unchanged lines remain neutral." },
          { q: "Can I compare word-by-word or character-by-character?", a: "Yes, both line-level and inline word/character diffing modes are available." },
          { q: "Can I view changes side-by-side or unified in a single column?", a: "Both split dual-pane view and unified unified-diff views are supported." },
          { q: "Is it safe to compare proprietary code snippets?", a: "Yes, comparison algorithms execute purely inside your browser without contacting any server." },
          { q: "Can I ignore trailing whitespace and line breaks?", a: "Yes, toggle options let you ignore whitespace differences if desired." }
        ]
      }
    ]
  },
  {
    name: "Direct Link Tools",
    slug: "direct-link-tools",
    accentColor: "#8b5cf6",
    status: "live",
    description: "Fetch, stream inspect, and convert external public asset URLs right in the client.",
    tools: [
      {
        name: "Direct Image Downloader",
        slug: "direct-image-downloader",
        icon: "DownloadCloud",
        shortDescription: "Download images from direct URLs with automatic format options.",
        longDescription: "Fetch and download images directly in your browser, inspect headers, bypass display blockers, and convert to preferred local formats.",
        status: "live",
        faqs: [
          { q: "How does the direct image downloader work?", a: "It uses client-side Fetch API and Blob streaming to retrieve and trigger native browser downloads." },
          { q: "Can I rename the file before saving?", a: "Yes, enter a custom filename and select an extension before downloading." },
          { q: "What if the image URL blocks hotlinking via CORS?", a: "The tool guides you on handling CORS and supports direct image URL fetching where permitted." },
          { q: "Can I convert the image to PNG or JPG before saving?", a: "Yes, convert remote WebP or SVG assets to standard formats on-the-fly." },
          { q: "Are the image URLs logged on any server?", a: "No, ToolGenie does not log or monitor any URLs you paste into the client." }
        ]
      },
      {
        name: "HLS Stream Downloader",
        slug: "hls-stream-downloader",
        icon: "Radio",
        shortDescription: "Inspect, parse, and download public HLS (.m3u8) video streams.",
        longDescription: "Parse HTTP Live Streaming manifests (.m3u8), view available video resolutions and bitrates, and stitch stream segments right in your browser.",
        status: "live",
        faqs: [
          { q: "What is an HLS .m3u8 stream?", a: "HLS is an adaptive streaming protocol that splits video into segmented TS or fMP4 chunks defined by an m3u8 playlist." },
          { q: "Can I inspect the different resolution quality streams?", a: "Yes, view master playlist variants from 360p up to 4K with respective bitrate details." },
          { q: "Does the stitching happen on my computer?", a: "Yes, stream chunks are assembled client-side into a continuous MP4 file." },
          { q: "Does this download DRM-protected streams?", a: "No, this tool is strictly designed for open, unencrypted educational and public media streams." },
          { q: "Can I preview playback before downloading?", a: "Yes, a built-in player allows you to preview the stream segments directly." }
        ]
      },
      {
        name: "URL to QR Code",
        slug: "url-to-qr-code",
        icon: "Link2",
        shortDescription: "Transform any website link into a scannable, high-contrast QR code.",
        longDescription: "Instantly encode clean hyperlinks with automatic protocol sanitation, UTM tracking support, and print-ready high-resolution downloads.",
        status: "live",
        faqs: [
          { q: "Can I add tracking parameters or UTM tags?", a: "Yes, you can input your full URL including query strings and campaign tags." },
          { q: "Does the tool automatically add `https://` if omitted?", a: "Yes, protocol sanitization ensures every QR code opens reliably on iOS and Android camera apps." },
          { q: "Is the QR code permanent?", a: "Yes, because the URL is embedded directly into the matrix, it will work as long as the destination website is alive." },
          { q: "Can I download vector SVG for business cards?", a: "Yes, download crisp vector SVGs that scale infinitely without pixel blur." },
          { q: "Can I preview the code before downloading?", a: "Yes, real-time live preview updates instantaneously as you type." }
        ]
      },
      {
        name: "File Hash Checker",
        slug: "file-hash-checker",
        icon: "ShieldCheck",
        shortDescription: "Calculate and verify checksums of local files against publisher hashes.",
        longDescription: "Drop ISOs, installers, or packages to calculate SHA-256 or MD5 hashes without uploading, ensuring files have not been corrupted or tampered with.",
        status: "live",
        faqs: [
          { q: "Can I verify multi-gigabyte files like OS ISO images?", a: "Yes, files are read in small binary chunks via HTML5 File API streams without loading the entire file into RAM." },
          { q: "Does the file get uploaded to the cloud?", a: "No! The entire checksum hashing loop runs strictly on your local device CPU." },
          { q: "How do I compare with the official hash?", a: "Paste the official checksum into the verification box, and the tool gives you an instant Green/Red match confirmation." },
          { q: "Which hash standards are verified?", a: "SHA-256, SHA-512, SHA-1, and MD5." },
          { q: "How fast is hashing on modern computers?", a: "Modern multi-core processors can hash large files at hundreds of megabytes per second." }
        ]
      }
    ]
  },
  {
    name: "Video Tools",
    slug: "video-tools",
    accentColor: "#ec4899",
    status: "coming-soon",
    description: "Fast in-browser video manipulation utilizing WebAssembly FFmpeg and WebCodecs.",
    tools: [
      {
        name: "Trim Video",
        slug: "trim-video",
        icon: "Video",
        shortDescription: "Cut out unwanted clips or select exact start and end timestamps.",
        longDescription: "Slice MP4, WebM, and MOV video clips with visual timeline scrubbing without re-encoding delays or cloud uploads.",
        status: "coming-soon",
        faqs: [
          { q: "Will video trimming require uploading large files?", a: "No, ToolGenie's upcoming video suite uses in-browser FFmpeg WebAssembly to execute all cuts locally." },
          { q: "Does lossless trimming avoid re-encoding?", a: "Yes, keyframe-based cuts will be supported to produce instant exports without quality degradation." },
          { q: "Which formats will be supported?", a: "MP4, WebM, MOV, and MKV formats." },
          { q: "Can I preview the exact frame when trimming?", a: "Yes, interactive scrubber thumbnails will let you pin down millisecond precision." },
          { q: "When will this tool be available?", a: "This tool is part of our upcoming release currently undergoing client-side WebAssembly optimization." }
        ]
      },
      {
        name: "Compress Video",
        slug: "compress-video",
        icon: "Minimize",
        shortDescription: "Reduce video file sizes to meet Discord, email, or web constraints.",
        longDescription: "Optimize bitrate, framerate, and resolution to shrink video files efficiently without sending private clips to remote servers.",
        status: "coming-soon",
        faqs: [
          { q: "How can videos be compressed in a browser?", a: "By leveraging multi-threaded WebAssembly encoders like x264 and VP9 running in background web workers." },
          { q: "Can I set a target file size like 8MB or 25MB?", a: "Yes, target-size mode automatically calculates the ideal bitrate for platform constraints." },
          { q: "Will my private videos remain secure?", a: "100%. No video frames or audio tracks are ever sent over the internet." },
          { q: "Will H.264 and H.265 be supported?", a: "Universal H.264 / AAC MP4 output will be standard for playback on all modern devices." },
          { q: "Can I downscale 4K video to 1080p or 720p?", a: "Yes, resolution presets will allow significant file size reductions." }
        ]
      },
      {
        name: "Video to GIF",
        slug: "video-to-gif",
        icon: "Film",
        shortDescription: "Convert exciting video moments into lightweight animated GIFs.",
        longDescription: "Turn video clips into shareable animated GIFs with custom framerate, width, color dithering palettes, and looping options.",
        status: "coming-soon",
        faqs: [
          { q: "Can I select a specific clip segment for the GIF?", a: "Yes, set in and out points to capture only the highlight reel." },
          { q: "How do I keep the GIF file size small?", a: "Adjust FPS (e.g. 10–15 fps) and scale dimensions (e.g. 480px width) for lightweight sharing." },
          { q: "What dithering algorithms are used?", a: "Floyd-Steinberg and palettegen algorithms ensure smooth color transitions without color banding." },
          { q: "Can I add text captions to the GIF?", a: "Text overlay customization will be integrated into the GIF export workflow." },
          { q: "Is audio preserved in a GIF?", a: "The GIF format does not support sound, but you can export as looping WebM/MP4 as well." }
        ]
      },
      {
        name: "Extract Audio",
        slug: "extract-audio",
        icon: "FileAudio",
        shortDescription: "Strip and save the sound track from any video file as MP3 or WAV.",
        longDescription: "Demux and save music, speeches, or background audio from video files into pure MP3, AAC, or uncompressed WAV audio files.",
        status: "coming-soon",
        faqs: [
          { q: "Is audio extraction fast?", a: "Yes, demuxing audio without re-encoding the stream is virtually instantaneous." },
          { q: "Can I export in MP3, AAC, and WAV formats?", a: "Yes, you can extract the raw audio stream or transcode to your preferred format." },
          { q: "Can I extract audio from long webinar recordings?", a: "Yes, long-form videos can be processed without cloud upload caps." },
          { q: "Does audio quality stay true to the original?", a: "Yes, uncompressed extraction retains the exact original audio bitrate and sample rate." },
          { q: "Will this work on smartphones?", a: "Yes, supported in modern mobile web browsers." }
        ]
      },
      {
        name: "Mute Video",
        slug: "mute-video",
        icon: "VolumeX",
        shortDescription: "Remove unwanted background noise or audio tracks from video files.",
        longDescription: "Strip the audio channel entirely from your video to produce silent clips for background website heroes or confidential sharing.",
        status: "coming-soon",
        faqs: [
          { q: "Does muting a video re-encode the video stream?", a: "No, stripping the audio track can be completed via stream-copy in seconds without quality loss." },
          { q: "Will the video file size decrease?", a: "Yes, removing audio reduces the file size by the weight of the audio stream." },
          { q: "Can I mute specific channels?", a: "The tool strips all audio tracks by default, ensuring complete silence." },
          { q: "Is this safe for proprietary recordings?", a: "Yes, since processing is purely local, sensitive corporate footage remains private." },
          { q: "What formats can be muted?", a: "All major formats including MP4, WebM, MOV, and AVI." }
        ]
      },
      {
        name: "Resize Video",
        slug: "resize-video",
        icon: "Scaling",
        shortDescription: "Change video dimensions, aspect ratios, or scale for social channels.",
        longDescription: "Scale video dimensions to 16:9 for YouTube, 9:16 for TikTok/Reels, or 1:1 for Instagram feeds with padding and cropping options.",
        status: "coming-soon",
        faqs: [
          { q: "Can I convert landscape video to portrait (9:16)?", a: "Yes, with smart center crop or blurred background padding options." },
          { q: "Will resizing retain the original framerate?", a: "Yes, framerates are preserved or can be customized as needed." },
          { q: "Can I select custom pixel dimensions?", a: "Yes, enter explicit width and height or lock standard aspect ratios." },
          { q: "Does this require GPU acceleration?", a: "It utilizes WebGL and WebGPU when available on your browser for faster rendering." },
          { q: "When will video resizing launch?", a: "Coming in Chunk 2 of the ToolGenie rollout." }
        ]
      },
      {
        name: "Convert Video Format",
        slug: "convert-video-format",
        icon: "ArrowRightLeft",
        shortDescription: "Convert between MP4, WebM, MOV, MKV, and AVI video formats.",
        longDescription: "Transcode video files into universally compatible MP4 containers or modern WebM formats directly on your local device.",
        status: "coming-soon",
        faqs: [
          { q: "Can I convert MOV files from iPhone to MP4?", a: "Yes, Apple QuickTime MOV files can be converted into standard MP4." },
          { q: "Is WebM conversion supported for web developers?", a: "Yes, encode into royalty-free VP8/VP9 WebM files optimized for web playback." },
          { q: "Are subtitles and multiple audio tracks preserved?", a: "You will be able to choose whether to passthrough or merge subtitle tracks." },
          { q: "Is this tool completely free?", a: "Yes, no watermarks, duration limits, or subscription tiers." },
          { q: "Does it upload files to third-party servers?", a: "Never. All transcoding operates locally via WebAssembly." }
        ]
      }
    ]
  },
  {
    name: "Audio Tools",
    slug: "audio-tools",
    accentColor: "#06b6d4",
    status: "live",
    description: "Edit, convert, and polish audio recordings and music files locally.",
    tools: [
      {
        name: "Audio Trimmer",
        slug: "audio-trimmer",
        icon: "Scissors",
        shortDescription: "Cut music, voice notes, and sound effects with an interactive waveform.",
        longDescription: "Trim MP3, WAV, M4A, and OGG audio with an interactive audio waveform visualizer and millisecond-accurate cue points.",
        status: "live",
        faqs: [
          { q: "Can I see an interactive waveform of my track?", a: "Yes, a visual waveform displays peaks and valleys for precision clipping." },
          { q: "Does it support fade-in and fade-out effects?", a: "Yes, customizable fade-in and fade-out curves prevent abrupt audio clipping." },
          { q: "Can I make ringtones from songs?", a: "Yes, select your favorite chorus and export as an MP3 or M4R ringtone." },
          { q: "Are audio files uploaded to any server?", a: "No, the Web Audio API processes sound samples entirely in browser memory." },
          { q: "Can I zoom in on the waveform?", a: "Yes, pinch or scroll to zoom in down to individual sound peaks." }
        ]
      },
      {
        name: "Audio Converter",
        slug: "audio-converter",
        icon: "Repeat",
        shortDescription: "Transcode between MP3, WAV, AAC, FLAC, OGG, and M4A formats.",
        longDescription: "Convert audio formats quickly and seamlessly. Turn lossless FLAC or WAV recordings into compact MP3 or modern AAC files.",
        status: "live",
        faqs: [
          { q: "What audio formats will be supported?", a: "MP3, WAV, AAC, M4A, FLAC, OGG, and OPUS formats." },
          { q: "Can I adjust the audio bitrate?", a: "Yes, choose bitrates from 64 kbps up to 320 kbps, or uncompressed 24-bit WAV." },
          { q: "Can I convert voice memos recorded on phones?", a: "Yes, M4A or 3GP voice notes convert cleanly into universal MP3s." },
          { q: "Is the conversion lossless?", a: "Converting to FLAC or WAV preserves 100% audio fidelity without loss." },
          { q: "Will batch conversion be supported?", a: "Yes, convert multiple songs or voice tracks simultaneously." }
        ]
      },
      {
        name: "Audio Compressor",
        slug: "audio-compressor",
        icon: "Layers",
        shortDescription: "Shrink podcast and audio file sizes while keeping voices clear.",
        longDescription: "Optimize voice and music files to meet email attachment caps or storage limits by tuning bitrates, channels, and sample rates.",
        status: "live",
        faqs: [
          { q: "How much can audio file size be reduced?", a: "Uncompressed WAV or high-bitrate audio can often be reduced by 70% to 90%." },
          { q: "Can I convert stereo audio to mono to save space?", a: "Yes, merging stereo into mono is an effective way to cut voice podcast sizes in half." },
          { q: "Will voice clarity be preserved?", a: "Specialized speech frequency weighting ensures voices remain intelligible and crisp." },
          { q: "Can I set a target file size?", a: "Yes, input a target megabyte ceiling to automatically configure optimal parameters." },
          { q: "Does this require special software installed on my PC?", a: "No, it works in any standard web browser without plugins." }
        ]
      },
      {
        name: "Change Volume",
        slug: "change-volume",
        icon: "Volume2",
        shortDescription: "Boost quiet recordings or normalize loud audio tracks.",
        longDescription: "Increase volume on quiet voice notes or reduce clipping distortion on loud tracks with intelligent gain adjustments and normalization.",
        status: "live",
        faqs: [
          { q: "Can I amplify quiet speech recordings?", a: "Yes, boost volume up to 200% or 300% with automatic peak limiting to prevent distortion." },
          { q: "What is audio normalization?", a: "Normalization scales the loudest sound to 0 dBFS so tracks play at consistent, comfortable volumes." },
          { q: "Can I preview the boosted audio before downloading?", a: "Yes, live audio playback lets you audition adjustments in real time." },
          { q: "Does boosting audio add background hiss?", a: "Digital gain amplifies existing signal; our built-in limiter minimizes harsh clipping." },
          { q: "Are files stored on your servers?", a: "No, audio never leaves your device's memory." }
        ]
      },
      {
        name: "Audio Metadata Editor",
        slug: "audio-metadata-editor",
        icon: "FileEdit",
        shortDescription: "View and edit ID3 tags, artist names, album art, and track numbers.",
        longDescription: "Organize your music library by editing ID3 tags on MP3, FLAC, and M4A files directly in your browser without desktop taggers.",
        status: "live",
        faqs: [
          { q: "Which ID3 tags can I edit?", a: "Song title, artist, album, genre, year, track number, composer, and comments." },
          { q: "Can I embed album cover art?", a: "Yes, upload and embed custom JPG or PNG artwork directly into the audio file." },
          { q: "Does editing metadata re-encode the music?", a: "No, only the tag header blocks are updated, so audio fidelity remains completely untouched." },
          { q: "Which audio formats support tag editing?", a: "MP3 (ID3v1 and ID3v2), FLAC (Vorbis comments), and M4A/MP4 tags." },
          { q: "Can I view existing audio bitrate and sample rate?", a: "Yes, detailed technical audio stream properties are displayed upon loading." }
        ]
      }
    ]
  },
  {
    name: "Converter Tools",
    slug: "converter-tools",
    accentColor: "#6366f1",
    status: "live",
    description: "Seamlessly translate formats between structured data, markup, documents, and units.",
    tools: [
      {
        name: "HEIC to JPG",
        slug: "heic-to-jpg",
        icon: "FileImage",
        shortDescription: "Convert Apple iPhone HEIC/HEIF photos to universal JPG format.",
        longDescription: "Unlock modern iOS photos for Windows, Android, and web platforms. Convert Apple HEIC and HEIF files into high-quality JPEG images instantly.",
        status: "live",
        faqs: [
          { q: "What is a HEIC file?", a: "HEIC (High Efficiency Image Container) is the default image format used by modern iPhones for smaller photo sizes." },
          { q: "Why do I need to convert HEIC to JPG?", a: "Many Windows apps, older websites, and printing services do not support HEIC files natively." },
          { q: "Does the conversion preserve EXIF metadata and date taken?", a: "Yes, camera information, GPS tags, and timestamps are carried over to the resulting JPG." },
          { q: "Can I batch convert an entire album of iPhone photos?", a: "Yes, drop dozens of photos and download them packaged in a single ZIP." },
          { q: "Are my personal photos uploaded anywhere?", a: "Never. HEIC decoding runs 100% locally via WebAssembly libheif." }
        ]
      },
      {
        name: "CSV to JSON",
        slug: "csv-to-json",
        icon: "FileSpreadsheet",
        shortDescription: "Transform spreadsheet CSV rows into formatted JSON arrays or objects.",
        longDescription: "Parse comma-separated values (CSV) into structured JSON with automatic header detection, type inference for numbers and booleans, and custom delimiters.",
        status: "live",
        faqs: [
          { q: "Does it detect headers automatically from the first row?", a: "Yes, column headers are turned into JSON object keys automatically." },
          { q: "Can it infer numbers and boolean types instead of strings?", a: "Yes, a type-inference toggle parses `123` as numbers and `true/false` as booleans." },
          { q: "Can I customize the delimiter for TSV or semicolon files?", a: "Yes, support for commas, semicolons, tabs, and custom pipes is included." },
          { q: "Can I export as an array of objects or an array of arrays?", a: "Both structured models are selectable based on your API needs." },
          { q: "Is it safe for proprietary enterprise datasets?", a: "Yes, zero server transmission means confidential records remain on your workstation." }
        ]
      },
      {
        name: "JSON to CSV",
        slug: "json-to-csv",
        icon: "Table",
        shortDescription: "Flatten JSON arrays into spreadsheet-ready CSV or Excel files.",
        longDescription: "Convert complex JSON responses and nested structures into clean, tabular CSV files ready to open in Microsoft Excel, Google Sheets, or Numbers.",
        status: "live",
        faqs: [
          { q: "Can it handle nested JSON objects and arrays?", a: "Yes, nested properties are flattened into dot-notation columns (e.g. `user.address.city`)." },
          { q: "Does it properly escape quotes and commas in strings?", a: "Yes, standard RFC 4180 compliance ensures fields containing commas are safely quoted." },
          { q: "Can I download directly as an Excel-compatible file?", a: "Yes, with UTF-8 BOM encoding so special characters display accurately in Microsoft Excel." },
          { q: "Is there a row limit?", a: "You can process datasets with tens of thousands of rows smoothly in browser memory." },
          { q: "Can I copy the CSV output directly to my clipboard?", a: "Yes, one-click copy and download options are provided." }
        ]
      },
      {
        name: "Markdown to HTML",
        slug: "markdown-to-html",
        icon: "FileCode",
        shortDescription: "Render CommonMark and GitHub Flavored Markdown into clean HTML.",
        longDescription: "Convert READMEs, notes, and documentation from Markdown syntax into semantic, accessible HTML with syntax-highlighted code blocks.",
        status: "live",
        faqs: [
          { q: "Does it support GitHub Flavored Markdown (GFM)?", a: "Yes, tables, task lists, strikethrough, and autolinks are fully supported." },
          { q: "Can I view a live preview alongside the HTML code?", a: "Yes, a split-screen editor provides real-time rendered previews alongside the raw HTML markup." },
          { q: "Can I sanitize HTML output for security?", a: "Yes, an optional sanitizer strips risky script tags and inline handlers." },
          { q: "Can I copy formatted HTML or download as an `.html` file?", a: "Both options are supported with one click." },
          { q: "Does it support code syntax highlighting?", a: "Yes, code snippets in languages like JavaScript, Python, and CSS are cleanly highlighted." }
        ]
      },
      {
        name: "HTML to Markdown",
        slug: "html-to-markdown",
        icon: "FileText",
        shortDescription: "Convert web page HTML markup into clean, readable Markdown syntax.",
        longDescription: "Strip excessive HTML tags and inline styles, converting web articles and documentation into lightweight, clean Markdown for blogs and GitHub.",
        status: "live",
        faqs: [
          { q: "Can I paste HTML copied from websites or rich-text editors?", a: "Yes, paste raw HTML or formatted text directly into the input area." },
          { q: "How are tables and lists converted?", a: "Tables convert to clean ASCII Markdown tables, and unordered/ordered lists are preserved." },
          { q: "Does it strip unwanted `<div>` and `<span>` tags?", a: "Yes, non-semantic wrapper tags are discarded while preserving text hierarchy and emphasis." },
          { q: "Are images and hyperlinks maintained?", a: "Yes, links and images convert cleanly to `[text](url)` and `![alt](url)` notation." },
          { q: "Is there any risk of transmitting web scrapings to third parties?", a: "None. All DOM parsing and regex conversions execute in your local browser window." }
        ]
      },
      {
        name: "Unit Converter",
        slug: "unit-converter",
        icon: "Calculator",
        shortDescription: "Convert length, weight, temperature, data storage, speed, and area.",
        longDescription: "High-precision physical and digital unit conversions across metric and imperial systems with instantaneous real-time recalculations.",
        status: "live",
        faqs: [
          { q: "Which unit categories can I convert?", a: "Length, Weight/Mass, Temperature, Digital Storage (KB, MB, GB, TB), Speed, Area, Volume, and Time." },
          { q: "Does it support both metric and imperial measurements?", a: "Yes, convert seamlessly between meters/feet, kilograms/pounds, Celsius/Fahrenheit, and more." },
          { q: "How many decimal places of precision are shown?", a: "You can toggle precision up to 10 decimal places or use scientific notation." },
          { q: "Does it include digital data storage units?", a: "Yes, calculate conversions between Bytes, KB, KiB, MB, MiB, GB, GiB, and beyond." },
          { q: "Does this require an internet connection?", a: "No, all conversion formulas execute instantly offline." }
        ]
      }
    ]
  },
  {
    name: "AI Tools",
    slug: "ai-tools",
    accentColor: "#14b8a6",
    status: "coming-soon",
    description: "Private on-device machine learning models running via WebGPU and WebAssembly.",
    tools: [
      {
        name: "Text Summarizer",
        slug: "text-summarizer",
        icon: "Sparkles",
        shortDescription: "Condense long articles and reports into concise key takeaways.",
        longDescription: "Extract main concepts, bullet-point highlights, and brief executive summaries from long documents using localized on-device language models.",
        status: "coming-soon",
        faqs: [
          { q: "How can AI models run inside a web browser?", a: "Using WebGPU and optimized quantized ONNX models loaded directly into your browser's memory." },
          { q: "Is my text private when using AI summarization?", a: "Yes! Because the neural model runs on your own device GPU, no text is sent to external cloud APIs." },
          { q: "Can I control summary length?", a: "Yes, choose between short bullet points, medium overviews, or detailed executive summaries." },
          { q: "What languages will be supported?", a: "English and several major global languages will be supported at launch." },
          { q: "When will this AI tool be available?", a: "This model is being benchmarked for client-side WebGPU acceleration in Chunk 2-4." }
        ]
      },
      {
        name: "Grammar Checker",
        slug: "grammar-checker",
        icon: "CheckCheck",
        shortDescription: "Detect spelling errors, typos, and improve sentence clarity.",
        longDescription: "Proofread essays, emails, and articles with client-side linguistic rules and neural suggestion models without subscription paywalls.",
        status: "coming-soon",
        faqs: [
          { q: "Does this send my personal writing to third parties?", a: "No, all spellcheck and grammar rules execute locally in your browser sandbox." },
          { q: "Can it suggest improvements for tone and vocabulary?", a: "Yes, suggestions for passive voice, wordiness, and confusing phrasing will be provided." },
          { q: "Can I accept or reject suggestions with one click?", a: "Yes, interactive cards allow you to accept or discard edits individually." },
          { q: "Does it check punctuation and capitalization?", a: "Yes, misplaced commas, apostrophes, and capitalization errors are highlighted." },
          { q: "Is it completely free with no daily limits?", a: "Yes, ToolGenie provides unlimited free usage for everyone." }
        ]
      },
      {
        name: "Background Remover",
        slug: "background-remover",
        icon: "Wand2",
        shortDescription: "Erase photo backgrounds automatically with edge-aware AI masks.",
        longDescription: "Isolate people, products, and vehicles from backgrounds to create transparent PNG cutouts in seconds using in-browser segmentation models.",
        status: "coming-soon",
        faqs: [
          { q: "How accurate is the client-side background removal?", a: "Trained vision models segment fine hair strands and complex product contours with crisp precision." },
          { q: "Does the output have a transparent background?", a: "Yes, downloads are exported as transparent PNGs ready for e-commerce and graphic design." },
          { q: "Can I replace the background with a solid color or custom photo?", a: "Yes, select clean white for Amazon/eBay listings or upload your own backdrop." },
          { q: "Are high-resolution photos supported?", a: "Yes, photos up to 4K resolution can be processed via WebGPU acceleration." },
          { q: "Are my photos uploaded to an AI cloud server?", a: "Never. All AI vision tensors run directly on your computer's graphics hardware." }
        ]
      },
      {
        name: "Image to Text (OCR)",
        slug: "image-to-text-ocr",
        icon: "ScanText",
        shortDescription: "Extract text from photos, scans, receipts, and screenshots.",
        longDescription: "Optical Character Recognition (OCR) powered by Tesseract WebAssembly. Convert flattened images and scanned documents into copyable text.",
        status: "coming-soon",
        faqs: [
          { q: "What is OCR?", a: "Optical Character Recognition translates pixels of text into editable, searchable digital characters." },
          { q: "Can it recognize text from smartphone screenshots and receipts?", a: "Yes, screenshots, photographed book pages, receipts, and signs are recognized." },
          { q: "How many languages can it recognize?", a: "Over 60 languages will be downloadable on-demand as local offline language packs." },
          { q: "Can I copy the recognized text to clipboard or export as TXT?", a: "Yes, copy with a single click or download as a formatted plain text file." },
          { q: "Does OCR require uploading sensitive documents?", a: "No, Tesseract runs natively inside your browser tab via WebAssembly." }
        ]
      }
    ]
  }
];

// Helper to get all tools flattened
export const getAllTools = () => {
  return categories.flatMap(cat => 
    cat.tools.map(tool => ({
      ...tool,
      categoryName: cat.name,
      categorySlug: cat.slug,
      categoryAccentColor: cat.accentColor
    }))
  );
};

// Popular tools helper (6-8 featured tools)
export const popularToolSlugs = [
  "merge-pdf",
  "image-compressor",
  "json-formatter",
  "qr-code-generator",
  "word-counter",
  "password-generator",
  "direct-image-downloader",
  "image-converter"
];

export const getPopularTools = () => {
  const all = getAllTools();
  return popularToolSlugs
    .map(slug => all.find(t => t.slug === slug))
    .filter(Boolean);
};
