import { useState, useEffect } from 'react';

export interface PropertyType {
  id: string;
  name: string;
}

export interface Category {
  id: string;
  name: string;
}

export function usePropertyTaxonomy() {
  const [propertyTypes, setPropertyTypes] = useState<PropertyType[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000";
        const [typesRes, catsRes] = await Promise.all([
          fetch(`${baseUrl}/taxonomy/types`),
          fetch(`${baseUrl}/taxonomy/categories`)
        ]);

        if (typesRes.ok) setPropertyTypes(await typesRes.json());
        if (catsRes.ok) setCategories(await catsRes.json());
      } catch (error) {
        console.error('Failed to fetch taxonomy:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return { propertyTypes, categories, isLoading };
}
