import React, { useState } from 'react';
import ProductCard from '../ProductCard';
import SkeletonHomeView from '../ui/SkeletonHomeView';
import BannerCarousel from '../common/BannerCarousel';
import { motion } from 'framer-motion';
import { staggerContainer, cardVerify } from '../../utils/animations';
import PageTransition from '../ui/PageTransition';
