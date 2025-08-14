// src/complex.js

/**
 * Represents a complex number.
 * @param {number} re - The real part.
 * @param {number} im - The imaginary part.
 * @returns {{re: number, im: number}} A complex number object.
 */
export const complex = (re, im) => ({ re, im });

/**
 * Adds two complex numbers.
 * @param {{re: number, im: number}} z1
 * @param {{re: number, im: number}} z2
 * @returns {{re: number, im: number}}
 */
export const add = (z1, z2) => complex(z1.re + z2.re, z1.im + z2.im);

/**
 * Subtracts the second complex number from the first.
 * @param {{re: number, im: number}} z1
 * @param {{re: number, im: number}} z2
 * @returns {{re: number, im: number}}
 */
export const sub = (z1, z2) => complex(z1.re - z2.re, z1.im - z2.im);

/**
 * Multiplies a complex number by a real number.
 * @param {{re: number, im: number}} z
 * @param {number} r
 * @returns {{re: number, im: number}}
 */
export const mulReal = (z, r) => complex(z.re * r, z.im * r);

/**
 * Divides a complex number by a real number.
 * @param {{re: number, im: number}} z
 * @param {number} r
 * @returns {{re: number, im: number}}
 */
export const divReal = (z, r) => complex(z.re / r, z.im / r);
