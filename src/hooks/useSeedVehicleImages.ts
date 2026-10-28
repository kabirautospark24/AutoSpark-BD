import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

type SeedImage = { url: string; order: number; isPrimary: boolean };

/**
 * Seeds a vehicle's image gallery in Supabase the first time it is viewed.
 * Idempotent: inserts only when the vehicle has no images yet.
 *
 * Replaces the former per-model hooks (useSeedPradoImages / useSeedChrImages),
 * which were identical apart from the model name and image list.
 */
export const useSeedVehicleImages = (model: string, brand: string, images: SeedImage[]) => {
  const [isSeeded, setIsSeeded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const seedImages = async () => {
      try {
        if (!supabase) return;
        const { data: vehicles, error: vehicleError } = await supabase
          .from('vehicles')
          .select('id')
          .eq('model', model)
          .eq('brand_name', brand)
          .limit(1);

        if (vehicleError) {
          console.warn(`Could not fetch ${model} vehicle:`, vehicleError);
          if (!cancelled) setError(vehicleError.message);
          return;
        }

        if (!vehicles || vehicles.length === 0) {
          console.warn(`${model} vehicle not found in database`);
          if (!cancelled) setError(`${model} vehicle not found`);
          return;
        }

        const vehicleId = vehicles[0].id;

        const { data: existingImages, error: checkError } = await supabase
          .from('vehicle_images')
          .select('id')
          .eq('vehicle_id', vehicleId);

        if (checkError) {
          console.warn('Could not check existing images:', checkError);
          return;
        }

        if (existingImages && existingImages.length === 0) {
          const imagesToInsert = images.map((img) => ({
            vehicle_id: vehicleId,
            image_url: img.url,
            display_order: img.order,
            is_primary: img.isPrimary,
          }));

          const { error: insertError } = await supabase
            .from('vehicle_images')
            .insert(imagesToInsert);

          if (insertError) {
            console.warn(`Could not insert ${model} images:`, insertError);
            if (!cancelled) setError(insertError.message);
            return;
          }

          console.log(`${model} images seeded successfully`);
        } else {
          console.log(`${model} images already exist`);
        }
        if (!cancelled) setIsSeeded(true);
      } catch (err) {
        console.warn(`Error seeding ${model} images:`, err);
        if (!cancelled) setError(err instanceof Error ? err.message : 'Unknown error');
      }
    };

    seedImages();
    return () => {
      cancelled = true;
    };
  }, [model, brand, images]);

  return { isSeeded, error };
};
