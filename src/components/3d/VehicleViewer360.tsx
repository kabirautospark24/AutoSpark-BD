import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';

interface VehicleViewer360Props {
  vehicleName?: string;
  brandImage?: string;
  colors?: { name: string; hex: string }[];
  wheelOptions?: { name: string; image: string }[];
}

export const VehicleViewer360: React.FC<VehicleViewer360Props> = ({ 
  vehicleName = 'Toyota Crown 2022',
  brandImage = 'https://images.pexels.com/photos/36317642/pexels-photo-36317642.png',
  colors = [],
  wheelOptions = [],
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const [rotationY, setRotationY] = useState(0);
  const [rotationX, setRotationX] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedWheel, setSelectedWheel] = useState<string | null>(null);
  const mouseX = useRef(0);
  const mouseY = useRef(0);

  useEffect(() => {
    const onMouseMove = (event: MouseEvent) => {
      if (!autoRotate && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        mouseX.current = (event.clientX - rect.left) / rect.width - 0.5;
        mouseY.current = (event.clientY - rect.top) / rect.height - 0.5;
      }
    };

    const onTouchMove = (event: TouchEvent) => {
      if (!autoRotate && containerRef.current && event.touches[0]) {
        const rect = containerRef.current.getBoundingClientRect();
        mouseX.current = (event.touches[0].clientX - rect.left) / rect.width - 0.5;
        mouseY.current = (event.touches[0].clientY - rect.top) / rect.height - 0.5;
      }
    };

    containerRef.current?.addEventListener('mousemove', onMouseMove);
    containerRef.current?.addEventListener('touchmove', onTouchMove);

    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);

      if (autoRotate) {
        setRotationY((prev) => (prev + 0.5) % 360);
        setRotationX((prev) => (prev + 0.1) % 360);
      } else {
        setRotationY((prev) => prev + mouseX.current * 2);
        setRotationX((prev) => prev + mouseY.current * 1);
      }
    };

    animate();

    return () => {
      containerRef.current?.removeEventListener('mousemove', onMouseMove);
      containerRef.current?.removeEventListener('touchmove', onTouchMove);
      cancelAnimationFrame(animationId);
    };
  }, [autoRotate]);

  const handleColorSelect = (colorName: string) => {
    setSelectedColor(colorName);
  };

  const handleWheelSelect = (wheelName: string) => {
    setSelectedWheel(wheelName);
  };

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="w-full bg-white rounded-2xl overflow-hidden shadow-xl"
    >
      <div className="relative">
        <div
          className="w-full h-[420] md:h-[480] bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100 flex items-center justify-center overflow-hidden"
          style={{ perspective: '1000px' }}
        >
          {imageError && (
            <div className="flex flex-col items-center justify-center text-gray-500">
              <AlertCircle className="h-12 w-12 mb-2" />
              <p className="text-sm">Image not available</p>
            </div>
          )}

          {!imageError && (
            <motion.div
              style={{
                rotateY: rotationY,
                rotateX: rotationX,
              }}
              transition={{ type: 'tween', duration: 0 }}
              className="relative w-full h-[420] md:h-[480] flex items-center justify-center"
            >
              <img
                src={selectedWheel ? '/placeholder-wheel.png' : brandImage}
                alt={vehicleName}
                className="w-full h-full object-contain p-4"
                onError={() => setImageError(true)}
              />
            </motion.div>
          )}

          {/* Color selection sidebar */}
          {colors.length > 0 && (
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-2">
              <div>
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Color</span>
              </div>
              <div className="flex gap-2">
                {colors.map((color) => (
                  <button
                    key={color.name}
                    onClick={() => handleColorSelect(color.name)}
                    className="w-8 h-8 rounded-full border-2 transition-colors"
                    style={{ backgroundColor: color.hex }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Wheel selection sidebar */}
          {wheelOptions.length > 0 && (
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-2">
              <div>
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Wheels</span>
              </div>
              <div className="flex gap-2">
                {wheelOptions.map((wheel) => (
                  <button
                    key={wheel.name}
                    onClick={() => handleWheelSelect(wheel.name)}
                    className="w-8 h-8 rounded-lg border-2 transition-colors"
                    style={{ backgroundImage: `url('${wheel.image}')` }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Control button */}
          <div className="absolute top-4 right-4">
            <button
              onClick={() => setAutoRotate(!autoRotate)}
              className="px-3 py-1 bg-primary text-white text-sm rounded-full hover:bg-red-700 transition"
            >
              {autoRotate ? 'Manual' : 'Auto'}
            </button>
          </div>

          {/* Status bar */}
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
            <div>{autoRotate ? 'Auto-rotating' : 'Drag to rotate'}</div>
            {selectedColor && <span>Color: {selectedColor}</span>}
            {selectedWheel && <span>Wheels: {selectedWheel}</span>}
          </div>
        </div>

        {/* Orbit info */}
        <div className="absolute top-4 left-4">
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className="px-3 py-1 bg-gray-200 text-gray-800 text-sm rounded-full"
          >
            {autoRotate ? 'Stop orbit' : 'Start orbit'}
          </button>
        </div>
      </div>
    </motion.div>
  );
};