import React, { createContext, useContext } from 'react';

const DocumentBaseUrlContext = createContext<string | undefined>(undefined);

/** Base URL that repo-relative links and documentation paths are opened against. */
export const useDocumentBaseUrl = () => useContext(DocumentBaseUrlContext);

interface DocumentBaseUrlProviderProps {
	baseUrl?: string;
	children: React.ReactNode;
}

export const DocumentBaseUrlProvider: React.FC<DocumentBaseUrlProviderProps> = ({ baseUrl, children }) => (
	<DocumentBaseUrlContext.Provider value={baseUrl}>{children}</DocumentBaseUrlContext.Provider>
);
