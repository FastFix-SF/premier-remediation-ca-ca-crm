
import React from 'react';

interface Product {
  gauge: string;
  color: string;
  support: string;
  unit: string;
}

interface ProductSpecificationsProps {
  product: Product;
}

const ProductSpecifications = ({ product }: ProductSpecificationsProps) => {
  const specs = [
    { label: 'Gauge', value: product.gauge, color: 'bg-[#146193]/10 text-[#146193] border-[#146193]/20' },
    { label: 'Color', value: product.color, color: 'bg-gray-100 text-gray-700 border-gray-200' },
    { label: 'Support Type', value: product.support, color: 'bg-[#77bd47]/10 text-[#77bd47] border-[#77bd47]/20' },
    { label: 'Unit', value: product.unit, color: 'bg-purple-50 text-purple-700 border-purple-200' },
  ];

  return (
    <div className="bg-gray-50 rounded-2xl p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Specifications</h3>
      <div className="grid grid-cols-2 gap-4">
        {specs.map((spec, index) => (
          <div key={index} className="space-y-2">
            <div className="text-sm font-medium text-gray-600">{spec.label}</div>
            <div className={`inline-block px-3 py-2 text-sm font-semibold rounded-lg border ${spec.color}`}>
              {spec.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductSpecifications;
