// Compatibility boundary for legacy smart-contract modules. AppKit also
// augments Window.ethereum, but those modules predate its typed provider and
// still access request/on/selectedAddress directly. New integrations should
// use the typed Wagmi/AppKit clients instead.
interface Window {
  ethereum?: any;
}
