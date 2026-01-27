import { motion } from 'framer-motion';
import { fadeIn, slideUp } from '../../utils/animations';

interface PageTransitionProps {
    children: React.ReactNode;
    className?: string;
    variant?: 'fade' | 'slide';
}

export default function PageTransition({ children, className = '', variant = 'fade' }: PageTransitionProps) {
    const anim = variant === 'slide' ? slideUp : fadeIn;

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={anim as any}
            className={className}
            style={{ width: '100%', height: '100%' }}
        >
            {children}
        </motion.div>
    );
}
