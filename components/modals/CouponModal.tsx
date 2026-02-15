'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { API } from '../../services/api';
import styles from './CouponModal.module.css';

interface CouponModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApplyCoupon: (coupon: { code: string; discount: number; type: string; value: number }) => void;
    cartTotal: number;
    customerId?: string;
}

interface CouponInfo {
    code: string;
    type: string;
    value: number;
    minValue?: number;
    tipoUso?: string;
}

type FeedbackType = 'success' | 'error' | 'warning' | 'loading' | null;

export default function CouponModal({ isOpen, onClose, onApplyCoupon, cartTotal, customerId }: CouponModalProps) {
    // Estados
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [couponCode, setCouponCode] = useState('');
    const [validatedCoupon, setValidatedCoupon] = useState<CouponInfo | null>(null);
    const [feedback, setFeedback] = useState<{ type: FeedbackType; message: string }>({ type: null, message: '' });
    const [isValidating, setIsValidating] = useState(false);

    const inputRef = useRef<HTMLInputElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const validateTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Formatar moeda
    const formatCurrency = (value: number): string => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    // Calcular desconto
    const calculateDiscount = useCallback(
        (coupon: CouponInfo): number => {
            if (coupon.type === 'PORCENTAGEM') {
                return cartTotal * (coupon.value / 100);
            }
            return Math.min(coupon.value, cartTotal);
        },
        [cartTotal]
    );

    // Reset ao abrir
    useEffect(() => {
        if (isOpen) {
            setStep(1);
            setCouponCode('');
            setValidatedCoupon(null);
            setFeedback({ type: null, message: '' });
            setIsValidating(false);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    // Fechar com ESC
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    // Scroll input into view when keyboard opens
    const handleInputFocus = () => {
        // Delay para esperar o teclado abrir completamente
        setTimeout(() => {
            if (inputRef.current && contentRef.current) {
                // Usar scrollIntoView no input
                inputRef.current.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
            }
        }, 350); // Delay maior para Android
    };

    // Validação em tempo real (debounced)
    useEffect(() => {
        if (validateTimerRef.current) {
            clearTimeout(validateTimerRef.current);
        }

        if (couponCode.length < 3) {
            setFeedback({ type: null, message: '' });
            setValidatedCoupon(null);
            return;
        }

        setFeedback({ type: 'loading', message: 'Verificando cupom...' });

        validateTimerRef.current = setTimeout(async () => {
            try {
                setIsValidating(true);
                const result = await API.validateCouponWithContext({
                    code: couponCode,
                    customerId: customerId || 'GUEST',
                    subtotal: cartTotal
                });

                if (result.success) {
                    // 🔒 SECURITY FIX: Verificação híbrida para cupons de uso único
                    // Se Supabase retornou sucesso mas cupom é UNICO e usuário é GUEST, bloquear no frontend
                    const isGuest = !customerId || customerId === 'GUEST';
                    const isUnico = String(result.tipoUso).toUpperCase() === 'UNICO';

                    if (isUnico && isGuest) {
                        setValidatedCoupon(null);
                        setFeedback({
                            type: 'error',
                            message: 'Faça login para usar este cupom'
                        });
                        return;
                    }

                    setValidatedCoupon({
                        code: couponCode.toUpperCase(),
                        type: result.type,
                        value: result.value,
                        minValue: result.minValue,
                        tipoUso: result.tipoUso
                    });
                    setFeedback({
                        type: 'success',
                        message: `Cupom encontrado! ${result.type === 'PORCENTAGEM' ? `${result.value}% OFF` : formatCurrency(result.value) + ' OFF'}`
                    });
                } else {
                    setValidatedCoupon(null);
                    setFeedback({
                        type: 'error',
                        message: result.message || 'Cupom inválido'
                    });
                }
            } catch (_error) {
                setValidatedCoupon(null);
                setFeedback({
                    type: 'error',
                    message: 'Erro ao validar cupom'
                });
            } finally {
                setIsValidating(false);
            }
        }, 600);

        return () => {
            if (validateTimerRef.current) {
                clearTimeout(validateTimerRef.current);
            }
        };
    }, [couponCode, customerId, cartTotal]);

    // Avançar para passo 2
    const handleContinue = () => {
        if (validatedCoupon) {
            setStep(2);
            // Scroll to top of content
            contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    // Aplicar cupom (passo 2 → 3)
    const handleApply = () => {
        if (validatedCoupon) {
            setStep(3);

            // Após 1.5 segundos, aplica e fecha
            setTimeout(() => {
                const discount = calculateDiscount(validatedCoupon);
                onApplyCoupon({
                    code: validatedCoupon.code,
                    discount,
                    type: validatedCoupon.type,
                    value: validatedCoupon.value
                });
            }, 1500);
        }
    };

    // Limpar cupom
    const handleClear = () => {
        setCouponCode('');
        setValidatedCoupon(null);
        setFeedback({ type: null, message: '' });
        inputRef.current?.focus();
    };

    if (!isOpen) return null;

    // Render buttons based on current step
    const renderButtons = () => {
        if (step === 3) return null; // No buttons on success step

        if (step === 1) {
            return (
                <div className={styles.buttonsFooter}>
                    <div className={styles.buttons}>
                        <button
                            type="button"
                            onClick={handleClear}
                            className={styles.btnSecondary}
                            disabled={!couponCode}
                        >
                            Limpar
                        </button>
                        <button
                            type="button"
                            onClick={handleContinue}
                            className={styles.btnPrimary}
                            disabled={!validatedCoupon || isValidating}
                        >
                            Continuar
                        </button>
                    </div>
                </div>
            );
        }

        if (step === 2) {
            return (
                <div className={styles.buttonsFooter}>
                    <div className={styles.buttons}>
                        <button type="button" onClick={() => setStep(1)} className={styles.btnSecondary}>
                            Voltar
                        </button>
                        <button type="button" onClick={handleApply} className={styles.btnPrimary}>
                            <span>🎟️</span> Aplicar Cupom
                        </button>
                    </div>
                </div>
            );
        }

        return null;
    };

    return (
        <>
            {/* Overlay */}
            <div className={styles.overlay} onClick={onClose} role="presentation" />

            {/* Modal Wrapper - Flex container for positioning */}
            <div className={styles.modalWrapper}>
                {/* Modal */}
                <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="coupon-modal-title">
                    {/* Header */}
                    <div className={styles.header}>
                        <div className={styles.headerContent}>
                            <span className={styles.headerIcon}>🎟️</span>
                            <div>
                                <h2 id="coupon-modal-title" className={styles.headerTitle}>
                                    Cupom de Desconto
                                </h2>
                                <p className={styles.headerSubtitle}>Aplique seu cupom e economize</p>
                            </div>
                        </div>
                        <button type="button" onClick={onClose} className={styles.closeButton} aria-label="Fechar">
                            ✕
                        </button>
                    </div>

                    {/* Progress Steps */}
                    <div className={styles.progress}>
                        <div className={`${styles.progressStep} ${step >= 1 ? styles.active : ''}`}>
                            <span className={styles.stepNumber}>1</span>
                            <span className={styles.stepLabel}>Escolher</span>
                        </div>
                        <div className={styles.progressLine} />
                        <div className={`${styles.progressStep} ${step >= 2 ? styles.active : ''}`}>
                            <span className={styles.stepNumber}>2</span>
                            <span className={styles.stepLabel}>Validar</span>
                        </div>
                        <div className={styles.progressLine} />
                        <div className={`${styles.progressStep} ${step >= 3 ? styles.active : ''}`}>
                            <span className={styles.stepNumber}>3</span>
                            <span className={styles.stepLabel}>Aplicar</span>
                        </div>
                    </div>

                    {/* Scrollable Content */}
                    <div className={styles.content} ref={contentRef}>
                        {/* STEP 1: Escolher */}
                        {step === 1 && (
                            <div className={styles.stepContent}>
                                <label htmlFor="coupon-input" className={styles.inputLabel}>
                                    Insira seu cupom
                                </label>
                                <div className={styles.inputWrapper}>
                                    <input
                                        ref={inputRef}
                                        id="coupon-input"
                                        type="text"
                                        value={couponCode}
                                        onChange={e => setCouponCode(e.target.value.toUpperCase())}
                                        placeholder="Ex: BEMVINDO10"
                                        className={`${styles.input} ${feedback.type === 'success' ? styles.inputSuccess : ''} ${feedback.type === 'error' ? styles.inputError : ''}`}
                                        autoComplete="off"
                                        onFocus={handleInputFocus}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter' && validatedCoupon) {
                                                handleContinue();
                                            }
                                        }}
                                    />
                                    {isValidating && (
                                        <div className={styles.inputSpinner}>
                                            <div className={styles.spinner} />
                                        </div>
                                    )}
                                    {!isValidating && feedback.type === 'success' && (
                                        <span className={styles.inputIcon}>✓</span>
                                    )}
                                    {!isValidating && feedback.type === 'error' && (
                                        <span className={`${styles.inputIcon} ${styles.iconError}`}>✕</span>
                                    )}
                                </div>

                                {/* Feedback */}
                                {feedback.message && feedback.type !== 'loading' && (
                                    <div
                                        className={`${styles.feedback} ${styles[`feedback${feedback.type?.charAt(0).toUpperCase()}${feedback.type?.slice(1)}`]}`}
                                        role="alert"
                                    >
                                        {feedback.type === 'success' && '✓ '}
                                        {feedback.type === 'error' && '⚠️ '}
                                        {feedback.type === 'warning' && '⚠ '}
                                        {feedback.message}
                                    </div>
                                )}

                                {/* Subtotal Info */}
                                <div className={styles.subtotalInfo}>
                                    <span>Subtotal do pedido:</span>
                                    <span className={styles.subtotalValue}>{formatCurrency(cartTotal)}</span>
                                </div>
                            </div>
                        )}

                        {/* STEP 2: Validar */}
                        {step === 2 && validatedCoupon && (
                            <div className={styles.stepContent}>
                                <div className={styles.couponCard}>
                                    <div className={styles.couponCardHeader}>
                                        <span className={styles.couponCardIcon}>🏷️</span>
                                        <span className={styles.couponCardCode}>{validatedCoupon.code}</span>
                                    </div>
                                    <div className={styles.couponCardBody}>
                                        <div className={styles.couponDetailRow}>
                                            <span>Tipo de desconto:</span>
                                            <span className={styles.couponDetailValue}>
                                                {validatedCoupon.type === 'PORCENTAGEM' ? 'Porcentagem' : 'Valor Fixo'}
                                            </span>
                                        </div>
                                        <div className={styles.couponDetailRow}>
                                            <span>Desconto:</span>
                                            <span className={styles.couponDetailHighlight}>
                                                {validatedCoupon.type === 'PORCENTAGEM'
                                                    ? `${validatedCoupon.value}%`
                                                    : formatCurrency(validatedCoupon.value)}
                                            </span>
                                        </div>
                                        {validatedCoupon.tipoUso === 'UNICO' && (
                                            <div className={styles.couponWarning}>⚠️ Cupom de uso único</div>
                                        )}
                                    </div>
                                    <div className={styles.couponCardFooter}>
                                        <span>Você economiza:</span>
                                        <span className={styles.discountAmount}>
                                            -{formatCurrency(calculateDiscount(validatedCoupon))}
                                        </span>
                                    </div>
                                </div>

                                {/* Summary */}
                                <div className={styles.summary}>
                                    <div className={styles.summaryRow}>
                                        <span>Subtotal:</span>
                                        <span>{formatCurrency(cartTotal)}</span>
                                    </div>
                                    <div className={`${styles.summaryRow} ${styles.summaryDiscount}`}>
                                        <span>Desconto:</span>
                                        <span>-{formatCurrency(calculateDiscount(validatedCoupon))}</span>
                                    </div>
                                    <div className={`${styles.summaryRow} ${styles.summaryTotal}`}>
                                        <span>Novo total:</span>
                                        <span>{formatCurrency(cartTotal - calculateDiscount(validatedCoupon))}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* STEP 3: Sucesso */}
                        {step === 3 && validatedCoupon && (
                            <div className={`${styles.stepContent} ${styles.successStep}`}>
                                <div className={styles.successIcon}>
                                    <span>✓</span>
                                </div>
                                <h3 className={styles.successTitle}>Cupom Aplicado!</h3>
                                <p className={styles.successMessage}>
                                    {validatedCoupon.code} • Desconto de{' '}
                                    <strong>{formatCurrency(calculateDiscount(validatedCoupon))}</strong>
                                </p>
                                <div className={styles.successTotal}>
                                    <span>Novo total:</span>
                                    <span className={styles.successTotalValue}>
                                        {formatCurrency(cartTotal - calculateDiscount(validatedCoupon))}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sticky Footer with Buttons */}
                    {renderButtons()}
                </div>
            </div>
        </>
    );
}
