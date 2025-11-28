import React from 'react';
import type { AppBarProps } from "@/components/layouts";
import { MenuData } from './Menu';

export const AppBarData: AppBarProps = {
    logo: React.createElement('img', {
        src: '/images/logo.png',
        alt: 'logo',
        style: { width: '100%', height: '100%', objectFit: 'cover' },
    }),
    logoText: 'ADEPI',
    menuProps: MenuData,
};