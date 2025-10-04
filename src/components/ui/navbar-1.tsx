"use client" 

import * as React from "react"
import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Menu, X, LogOut, Plus, Calendar, Megaphone, Cog, List } from "lucide-react"
import Image from "next/image"

interface Navbar1Props {
  onLogout: () => void;
  onNewBooking: () => void;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  onNavigateToHistory?: () => void;
}

const Navbar1 = ({ onLogout, onNewBooking, activeTab, onTabChange, onNavigateToHistory }: Navbar1Props) => {
  const [isOpen, setIsOpen] = useState(false)

  const toggleMenu = () => setIsOpen(!isOpen)

  return (
    <div className="flex justify-center w-full py-6 px-4">
      <div className="flex items-center justify-between px-6 py-3 bg-white rounded-full shadow-lg w-full max-w-3xl relative z-10">

        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            whileHover={{ scale: 1.05 }}
          >
            <button 
              onClick={() => onTabChange?.('calendar')}
              className={`text-sm transition-colors font-medium flex items-center gap-2 ${activeTab === 'calendar' ? 'text-orange-600' : 'text-gray-900 hover:text-gray-600'}`}
            >
              <Calendar className="w-4 h-4" />
              Ημερολόγιο
            </button>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            whileHover={{ scale: 1.05 }}
          >
            <button 
              onClick={() => onTabChange?.('settings')}
              className={`text-sm transition-colors font-medium flex items-center gap-2 ${activeTab === 'settings' ? 'text-orange-600' : 'text-gray-900 hover:text-gray-600'}`}
            >
              <Cog className="w-4 h-4" />
              Ρυθμίσεις
            </button>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
            whileHover={{ scale: 1.05 }}
          >
            <button 
              onClick={() => onTabChange?.('announcements')}
              className={`text-sm transition-colors font-medium flex items-center gap-2 ${activeTab === 'announcements' ? 'text-orange-600' : 'text-gray-900 hover:text-gray-600'}`}
            >
              <Megaphone className="w-4 h-4" />
              Ανακοινώσεις
            </button>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.5 }}
            whileHover={{ scale: 1.05 }}
          >
            <button 
              onClick={onNavigateToHistory}
              className="text-sm transition-colors font-medium flex items-center gap-2 text-gray-900 hover:text-gray-600"
            >
              <List className="w-4 h-4" />
              Ραντεβού
            </button>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            whileHover={{ scale: 1.05 }}
          >
            <button 
              onClick={onNewBooking}
              className="text-sm text-gray-900 hover:text-gray-600 transition-colors font-medium flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Κράτηση
            </button>
          </motion.div>
        </nav>

        {/* Desktop CTA Button */}
        <motion.div
          className="hidden md:block"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          whileHover={{ scale: 1.05 }}
        >
          <button
            onClick={onLogout}
            className="inline-flex items-center justify-center px-5 py-2 text-sm text-white bg-black rounded-full hover:bg-gray-800 transition-colors"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Αποσύνδεση
          </button>
        </motion.div>

        {/* Mobile Menu Button */}
        <motion.button className="md:hidden flex items-center" onClick={toggleMenu} whileTap={{ scale: 0.9 }}>
          <Menu className="h-6 w-6 text-gray-900" />
        </motion.button>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 bg-white z-50 pt-24 px-6 md:hidden"
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            <motion.button
              className="absolute top-6 right-6 p-2"
              onClick={toggleMenu}
              whileTap={{ scale: 0.9 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <X className="h-6 w-6 text-gray-900" />
            </motion.button>
            <div className="flex flex-col space-y-6">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <button 
                  onClick={() => { onTabChange?.('calendar'); toggleMenu(); }}
                  className={`text-base font-medium flex items-center gap-2 ${activeTab === 'calendar' ? 'text-orange-600' : 'text-gray-900'}`}
                >
                  <Calendar className="w-4 h-4" />
                  Ημερολόγιο
                </button>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <button 
                  onClick={() => { onTabChange?.('settings'); toggleMenu(); }}
                  className={`text-base font-medium flex items-center gap-2 ${activeTab === 'settings' ? 'text-orange-600' : 'text-gray-900'}`}
                >
                  <Cog className="w-4 h-4" />
                  Ρυθμίσεις
                </button>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <button 
                  onClick={() => { onTabChange?.('announcements'); toggleMenu(); }}
                  className={`text-base font-medium flex items-center gap-2 ${activeTab === 'announcements' ? 'text-orange-600' : 'text-gray-900'}`}
                >
                  <Megaphone className="w-4 h-4" />
                  Ανακοινώσεις
                </button>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <button 
                  onClick={() => { onNavigateToHistory?.(); toggleMenu(); }}
                  className="text-base font-medium flex items-center gap-2 text-gray-900"
                >
                  <List className="w-4 h-4" />
                  Ραντεβού
                </button>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <button 
                  onClick={() => { onNewBooking(); toggleMenu(); }}
                  className="text-base text-gray-900 font-medium flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Κράτηση
                </button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                exit={{ opacity: 0, y: 20 }}
                className="pt-6"
              >
                <button
                  onClick={() => { onLogout(); toggleMenu(); }}
                  className="inline-flex items-center justify-center w-full px-5 py-3 text-base text-white bg-black rounded-full hover:bg-gray-800 transition-colors"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Αποσύνδεση
                </button>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export { Navbar1 } 