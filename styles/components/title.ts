/* eslint import/no-anonymous-default-export: [2, {"allowObject": true}] */
export default {
    // The styles all button have in common
    baseStyle: {
      fontWeight: "semibold",
      fontFamily: "heading",
      borderRadius: "0", // <-- border radius is same for all variants and sizes
      cursor: "pointer",
    },
    // Two sizes: sm and md
    // sizes: {
    //   sm: {
    //     fontSize: "sm",
    //     px: 4, // <-- px is short for paddingLeft and paddingRight
    //     py: 3, // <-- py is short for paddingTop and paddingBottom
    //   },
    //   md: {
    //     fontSize: "md",
    //     px: 6, // <-- these values are tokens from the design system
    //     py: 4, // <-- these values are tokens from the design system
    //   },
    // },
    // Two variants: outline and solid
    // variants: {
    //   outline: {
    //     border: "2px solid",
    //     borderColor: "primary.500",
    //     color: "black",
    //   },
    //   solid: {
    //     bg: "primary.500",
    //     color: "black",
    //     _hover: {
    //       color: "black",
    //       bg: "primary.600",
    //     },
    //   },
    // },
    // The default size and variant values
    defaultProps: {
      size: "md",
      variant: "solid",
    },
  };
  