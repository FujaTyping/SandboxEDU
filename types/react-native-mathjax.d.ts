declare module "react-native-mathjax" {
  import React from "react";
  import { StyleProp, ViewStyle } from "react-native";

  interface MathJaxProps {
    html: string;
    mathJaxOptions?: object;
    style?: StyleProp<ViewStyle>;
    onLayout?: () => void;
  }

  export default class MathJax extends React.Component<MathJaxProps> {}
}
