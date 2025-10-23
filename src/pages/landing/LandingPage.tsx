import React, { useState } from 'react';
import Header from '../../components/landing/Header';
import Hero from '../../components/landing/Hero';
import Pricing from '../../components/landing/Pricing';
import Features from '../../components/landing/Features';
import FAQ from '../../components/landing/FAQ';
import Footer from '../../components/landing/Footer';
import SignUpModal from '../../components/landing/SignUpModal';
import LoginModal from '../../components/landing/LoginModal';
import CreateCompanyModal from '../../components/onboarding/CreateCompanyModal';
import { AnimatePresence } from 'framer-motion';
import { Database } from '../../types/database.types';

type Empresa = Database['public']['Tables']['empresas']['Row'];

const LandingPage: React.FC = () => {
  const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isCreateCompanyModalOpen, setIsCreateCompanyModalOpen] = useState(false);
  const [createCompanyCallback, setCreateCompanyCallback] = useState<{ onSuccess: (newCompany: Empresa) => void } | null>(null);

  const openLoginModal = () => {
    setIsSignUpModalOpen(false);
    setIsLoginModalOpen(true);
  };

  const openSignUpModal = () => {
    setIsLoginModalOpen(false);
    setIsSignUpModalOpen(true);
  };
  
  const openCreateCompanyModal = (options: { onSuccess: (newCompany: Empresa) => void; }) => {
    setCreateCompanyCallback(options);
    setIsCreateCompanyModalOpen(true);
  };

  const closeModals = () => {
    setIsLoginModalOpen(false);
    setIsSignUpModalOpen(false);
    setIsCreateCompanyModalOpen(false);
  };

  return (
    <div className="bg-white">
      <Header onLoginClick={openLoginModal} />
      <main>
        <Hero onSignUpClick={openSignUpModal} />
        <Pricing onSignUpClick={openSignUpModal} onOpenCreateCompanyModal={openCreateCompanyModal} onLoginClick={openLoginModal} />
        <Features />
        <FAQ />
      </main>
      <Footer />

      <AnimatePresence>
        {isSignUpModalOpen && (
          <SignUpModal onClose={closeModals} onLoginClick={openLoginModal} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isLoginModalOpen && (
          <LoginModal onClose={closeModals} onSignUpClick={openSignUpModal} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isCreateCompanyModalOpen && (
            <CreateCompanyModal
                onClose={() => setIsCreateCompanyModalOpen(false)}
                onCompanyCreated={(newCompany) => {
                    setIsCreateCompanyModalOpen(false);
                    if (createCompanyCallback?.onSuccess) {
                        createCompanyCallback.onSuccess(newCompany);
                    }
                }}
            />
        )}
      </AnimatePresence>
    </div>
  );
};

export default LandingPage;
