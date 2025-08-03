"use client"
import React from 'react';
import { BottomNav } from '@/components/ui/bottom-nav';
import TopNav from '@/components/ui/top-nav'
import {TopBar } from '@/components/ui/top-bar'
import Map from '@/components/map'

export default function Shelter(){

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-300 to-purple-500 flex items-center justify-center p-4">
      {/* Phone frame container */}
      <div className="relative w-full max-w-sm h-[800px] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Top bar (mimicking phone status bar) */}
        <TopBar />
        {/* TopNav */}
        <TopNav title="Shelter"/>
        <div className="p-4">
            <div className="rounded-2xl overflow-hidden shadow h-96">
                {/* <Map center={[40.7128, -74.0060 ]} /> */}
                <Map /> 
            </div>    
        </div>
        
        {/* Bottom Navigation */}
        <BottomNav/>
      </div>
    </div>
  );
};
