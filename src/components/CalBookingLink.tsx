/**
 * Knop die de Cal.com-boekingspopup opent via het element-click embed
 * (data-cal-link, geïnitialiseerd in de root layout). Bewust een <button>
 * zonder href: een <a href target="_blank"> ernaast bleek niet betrouwbaar
 * te onderdrukken door Cal's eigen click-handler — bij testen opende de
 * klik zowel de embed-modal als een los tabblad tegelijk. Dit is exact
 * Cal.com's eigen aanbevolen patroon (een niet-navigerend element als
 * trigger), dus geen dubbele actie meer.
 */
export function CalBookingLink({
  label,
  className,
}: {
  label: string;
  className: string;
}) {
  return (
    <button
      type="button"
      data-cal-link="appwizer/quickscan"
      data-cal-namespace="quickscan"
      data-cal-config='{"layout":"month_view","useSlotsViewOnSmallScreen":"true"}'
      className={className}
    >
      {label}
    </button>
  );
}
