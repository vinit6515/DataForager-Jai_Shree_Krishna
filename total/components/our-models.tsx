// components/our-models.tsx
import { BrainCircuit } from 'lucide-react';
import Image from 'next/image';

export const OurModels = () => {
  const modelImages = [
    "/download.png", // Path to your first graph image
    "/download (1).png", // Path to your second graph image
    "/download (2).png"  // Path to your third graph image
  ];

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <BrainCircuit className="h-6 w-6 text-orange-600" />
        Our Models
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {modelImages.map((image, index) => (
          <div key={index} className="relative h-64 w-full rounded-lg overflow-hidden border border-gray-200">
            <Image
              src={image}
              alt={`Model visualization ${index + 1}`}
              fill
              className="object-contain p-2"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          </div>
        ))}
      </div>
    </div>
  );
};