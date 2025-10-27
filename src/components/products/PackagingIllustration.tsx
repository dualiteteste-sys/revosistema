import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { tipo_embalagem } from '../../types/database.types';

const BoxIcon = () => (
  <svg viewBox="0 0 150 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    {/* Box outline */}
    <path d="M40 85 V 45 L 75 25 L 110 45 V 85 L 75 105 L 40 85 Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    {/* Inner lines */}
    <path d="M75 25 L 75 65" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    <path d="M40 45 L 75 65" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    <path d="M110 45 L 75 65" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    
    {/* Dimension lines */}
    {/* Height (A) */}
    <path d="M35 85 V 45" stroke="currentColor" strokeWidth="1.5" />
    <path d="M32 45 H 38" stroke="currentColor" strokeWidth="1.5" />
    <path d="M32 85 H 38" stroke="currentColor" strokeWidth="1.5" />
    <text x="25" y="68" dominantBaseline="middle" textAnchor="middle" fontSize="12" fill="currentColor" fontWeight="bold">A</text>

    {/* Width (L) */}
    <path d="M40 88 L 75 108" stroke="currentColor" strokeWidth="1.5" />
    <path d="M38 85 L 42 91" stroke="currentColor" strokeWidth="1.5" />
    <path d="M73 105 L 77 111" stroke="currentColor" strokeWidth="1.5" />
    <text x="52" y="104" dominantBaseline="middle" textAnchor="middle" fontSize="12" fill="currentColor" fontWeight="bold">L</text>

    {/* Length (C) */}
    <path d="M78 108 L 113 88" stroke="currentColor" strokeWidth="1.5" />
    <path d="M76 105 L 80 111" stroke="currentColor" strokeWidth="1.5" />
    <path d="M111 85 L 115 91" stroke="currentColor" strokeWidth="1.5" />
    <text x="100" y="104" dominantBaseline="middle" textAnchor="middle" fontSize="12" fill="currentColor" fontWeight="bold">C</text>
  </svg>
);

const EnvelopeIcon = () => (
    <svg viewBox="0 0 150 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <rect x="25" y="30" width="100" height="60" stroke="currentColor" strokeWidth="2" rx="5" />
        <path d="M25 30L75 60L125 30" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <text x="75" y="25" textAnchor="middle" fontSize="10" fill="currentColor" fontWeight="bold">Largura</text>
        <text x="130" y="65" textAnchor="start" fontSize="10" fill="currentColor" fontWeight="bold">Comprimento</text>
    </svg>
);

const CylinderIcon = () => (
    <svg viewBox="0 0 150 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <ellipse cx="75" cy="25" rx="40" ry="10" stroke="currentColor" strokeWidth="2" />
        <path d="M35 25V95" stroke="currentColor" strokeWidth="2" />
        <path d="M115 25V95" stroke="currentColor" strokeWidth="2" />
        <ellipse cx="75" cy="95" rx="40" ry="10" stroke="currentColor" strokeWidth="2" />
        <text x="120" y="60" textAnchor="start" fontSize="10" fill="currentColor" fontWeight="bold">Comprimento</text>
        <text x="75" y="15" textAnchor="middle" fontSize="10" fill="currentColor" fontWeight="bold">Diâmetro</text>
    </svg>
);

const OtherIcon = () => (
    <svg viewBox="0 0 150 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect x="50" y="40" width="50" height="40" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" rx="5" />
      <text x="75" y="65" textAnchor="middle" fontSize="12" fill="currentColor" fontWeight="bold">?</text>
    </svg>
);


interface PackagingIllustrationProps {
  type: tipo_embalagem;
}

const PackagingIllustration: React.FC<PackagingIllustrationProps> = ({ type }) => {
  const renderIcon = () => {
    switch (type) {
      case 'pacote_caixa':
        return <BoxIcon />;
      case 'envelope':
        return <EnvelopeIcon />;
      case 'rolo_cilindro':
        return <CylinderIcon />;
      default:
        return <OtherIcon />;
    }
  };

  return (
    <div className="flex justify-center items-center p-4 rounded-lg text-gray-500 w-[150px] h-[120px] mx-auto">
      <AnimatePresence mode="wait">
        <motion.div
          key={type}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.3 }}
          className="w-full h-full"
        >
          {renderIcon()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default PackagingIllustration;
