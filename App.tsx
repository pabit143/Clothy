
import React, { useState, useCallback } from 'react';
import { generateVirtualTryOnImage } from './services/geminiService';
import { fileToBase64 } from './utils/fileUtils';
import { UploadIcon, DownloadIcon, SparklesIcon, UserIcon, ShirtIcon } from './components/Icons';
import Spinner from './components/Spinner';

interface ImageState {
  file: File;
  base64: string;
  mimeType: string;
}

const UploadBox: React.FC<{
  id: string;
  title: string;
  onFileChange: (file: File | null) => void;
  icon: React.ReactNode;
}> = ({ id, title, onFileChange, icon }) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    if (file) {
      setPreview(URL.createObjectURL(file));
      setFileName(file.name);
    } else {
      setPreview(null);
      setFileName('');
    }
    onFileChange(file);
  };

  return (
    <div className="bg-gray-800 border-2 border-dashed border-gray-600 rounded-2xl p-6 text-center transition-all duration-300 hover:border-indigo-500 hover:bg-gray-700/50 flex flex-col items-center justify-center h-64 md:h-80">
      <label htmlFor={id} className="cursor-pointer flex flex-col items-center justify-center w-full h-full">
        {preview ? (
          <img src={preview} alt="Preview" className="max-h-full max-w-full object-contain rounded-lg" />
        ) : (
          <>
            <div className="w-16 h-16 mb-4 text-gray-400">{icon}</div>
            <h3 className="text-lg font-semibold text-gray-200">{title}</h3>
            <p className="text-sm text-gray-500 mt-1">PNG, JPG, WebP</p>
          </>
        )}
        <input id={id} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      </label>
      {fileName && <p className="text-xs text-gray-400 mt-2 truncate max-w-full">{fileName}</p>}
    </div>
  );
};

export default function App() {
  const [personImage, setPersonImage] = useState<ImageState | null>(null);
  const [clothingImage, setClothingImage] = useState<ImageState | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = useCallback(async (file: File | null, type: 'person' | 'clothing') => {
    if (!file) {
      type === 'person' ? setPersonImage(null) : setClothingImage(null);
      return;
    }

    try {
      const { base64, mimeType } = await fileToBase64(file);
      const newState = { file, base64, mimeType };
      if (type === 'person') {
        setPersonImage(newState);
      } else {
        setClothingImage(newState);
      }
    } catch (err) {
      setError('Failed to process file. Please try another image.');
      console.error(err);
    }
  }, []);

  const handleTryOn = async () => {
    if (!personImage || !clothingImage) {
      setError('Please upload both images before trying on.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);

    try {
      const resultBase64 = await generateVirtualTryOnImage(personImage, clothingImage);
      setGeneratedImage(`data:image/png;base64,${resultBase64}`);
    } catch (err: any) {
      setError(`An error occurred: ${err.message}. Please try again.`);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDownload = () => {
    if (!generatedImage) return;
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = 'clothy-try-on.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isButtonDisabled = !personImage || !clothingImage || isLoading;

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans">
      <main className="container mx-auto px-4 py-8 md:py-12">
        <header className="text-center mb-10 md:mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-500">
              Clothy
            </span>
          </h1>
          <p className="mt-3 text-lg text-gray-400 max-w-2xl mx-auto">
            AI-Powered Virtual Try-On. See yourself in new styles instantly.
          </p>
        </header>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Input Section */}
          <div className="space-y-8 flex flex-col">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <UploadBox id="person-upload" title="Upload Your Photo" onFileChange={(file) => handleFileChange(file, 'person')} icon={<UserIcon />} />
              <UploadBox id="clothing-upload" title="Upload Clothing Item" onFileChange={(file) => handleFileChange(file, 'clothing')} icon={<ShirtIcon />} />
            </div>
            <button
              onClick={handleTryOn}
              disabled={isButtonDisabled}
              className="w-full flex items-center justify-center gap-3 bg-indigo-600 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 ease-in-out hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/50 disabled:bg-gray-700 disabled:cursor-not-allowed disabled:text-gray-400"
            >
              {isLoading ? (
                <>
                  <Spinner />
                  Generating...
                </>
              ) : (
                <>
                  <SparklesIcon />
                  Try It On
                </>
              )}
            </button>
            {error && <p className="text-red-400 text-center text-sm mt-2">{error}</p>}
          </div>

          {/* Output Section */}
          <div className="bg-gray-800 rounded-2xl flex items-center justify-center p-4 min-h-[30rem] lg:min-h-0 relative overflow-hidden">
            {isLoading && (
              <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                <Spinner />
                <p className="mt-4 text-lg">AI is working its magic...</p>
                <p className="text-sm text-gray-400">This may take a moment.</p>
              </div>
            )}

            {!generatedImage && !isLoading && (
              <div className="text-center text-gray-500">
                <div className="w-20 h-20 mx-auto mb-4">
                  <SparklesIcon />
                </div>
                <h3 className="text-xl font-medium text-gray-300">Your virtual try-on will appear here</h3>
                <p className="mt-1">Upload your photos and click "Try It On" to get started.</p>
              </div>
            )}
            
            {generatedImage && (
              <div className="w-full h-full flex flex-col items-center justify-center gap-4">
                <img src={generatedImage} alt="Generated virtual try-on" className="max-w-full max-h-[80%] object-contain rounded-lg shadow-2xl" />
                <button
                  onClick={handleDownload}
                  className="mt-4 flex items-center justify-center gap-2 bg-green-600 text-white font-semibold py-2 px-5 rounded-lg transition-colors hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-green-500/50"
                >
                  <DownloadIcon />
                  Download
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
