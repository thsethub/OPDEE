import React, { createContext, useState } from 'react';

export const contextDeviceId = createContext();
export const contextDeviceExists = createContext();
export const name = createContext();

export const ContextProvider = ({ children }) => {
    const [deviceId, setDeviceId] = useState(null);
    const [isDeviceIdExists, setIsDeviceIdExists] = useState(false);
    const [nome, setNome] = useState('');

    return (
        <contextDeviceId.Provider value={[deviceId, setDeviceId]}>
            <contextDeviceExists.Provider value={[isDeviceIdExists, setIsDeviceIdExists]}>
                <name.Provider value={[nome, setNome]}>
                    {children}
                </name.Provider>
            </contextDeviceExists.Provider>
        </contextDeviceId.Provider>
    );
};
