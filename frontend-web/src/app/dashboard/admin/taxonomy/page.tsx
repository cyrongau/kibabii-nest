import TaxonomyManager from '@/components/admin/TaxonomyManager';

export const metadata = {
  title: 'Taxonomy Management | Kibabii Nest Admin',
  description: 'Manage property categories and unit types',
};

export default function AdminTaxonomyPage() {
  return (
    <div className="p-4 md:p-8">
      <TaxonomyManager />
    </div>
  );
}
