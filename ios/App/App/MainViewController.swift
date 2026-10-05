import UIKit
import WebKit
import Capacitor

/// Capacitor's view controller, with the bounce every iOS scroll view has,
/// which Capacitor turns off for the web view.
class BridgeViewController: CAPBridgeViewController {
    override func webView(with frame: CGRect, configuration: WKWebViewConfiguration) -> WKWebView {
        WindowSafeAreaWebView(frame: frame, configuration: configuration)
    }

    override func capacitorDidLoad() {
        super.capacitorDidLoad()
        webView?.scrollView.bounces = true
        // A page shorter than the screen can be pulled as well.
        webView?.scrollView.alwaysBounceVertical = true
    }
}

/// A web view that keeps the window's safe area while it is pulled down.
/// Below the status bar it would have none at the top, and the page would
/// drop the room it keeps for the status bar as it comes down.
class WindowSafeAreaWebView: WKWebView {
    override var safeAreaInsets: UIEdgeInsets {
        window?.safeAreaInsets ?? super.safeAreaInsets
    }
}

/// The spinner of Mail's pull to refresh: while the page is pulled its ticks
/// come in one by one, clockwise from the top; past the threshold it pops and
/// turns. A `UIRefreshControl` draws it that way only for a finger dragging
/// its own scroll view, so the ticks are drawn here to its measure (30 points
/// across, grey 103 on white) and the turning is the system spinner's.
class RefreshIndicator: UIView {
    private static let tickCount = 8
    private static let outerRadius: CGFloat = 14.8
    private static let innerRadius: CGFloat = 5.2
    private static let tickWidth: CGFloat = 3.3

    private let ticks = UIView()
    private let spinner = UIActivityIndicatorView(style: .medium)

    override init(frame: CGRect) {
        super.init(frame: CGRect(x: 0, y: 0, width: 2 * Self.outerRadius, height: 2 * Self.outerRadius))
        isUserInteractionEnabled = false

        // Views rather than layers, which follow the appearance by themselves.
        let length = Self.outerRadius - Self.innerRadius
        let tickColor = UIColor { traits in
            UIColor(white: traits.userInterfaceStyle == .dark ? 1 : 0, alpha: 0.6)
        }
        ticks.bounds = CGRect(x: 0, y: 0, width: 2 * Self.outerRadius, height: 2 * Self.outerRadius)
        for index in 0..<Self.tickCount {
            let tick = UIView(frame: CGRect(
                x: Self.outerRadius - Self.tickWidth / 2,
                y: 0,
                width: Self.tickWidth,
                height: length
            ))
            tick.backgroundColor = tickColor
            tick.layer.cornerRadius = Self.tickWidth / 2
            tick.alpha = 0
            // Turned about the middle of the wheel.
            tick.layer.anchorPoint = CGPoint(x: 0.5, y: Self.outerRadius / length)
            tick.center = CGPoint(x: Self.outerRadius, y: Self.outerRadius)
            tick.transform = CGAffineTransform(rotationAngle: CGFloat(index) * 2 * .pi / CGFloat(Self.tickCount))
            ticks.addSubview(tick)
        }
        addSubview(ticks)

        // The same spinner, turning, as the one of a `UIRefreshControl`.
        spinner.transform = CGAffineTransform(scaleX: 1.5, y: 1.5)
        spinner.color = UIColor { traits in
            UIColor(white: traits.userInterfaceStyle == .dark ? 1 : 0, alpha: 0.75)
        }
        spinner.hidesWhenStopped = true
        addSubview(spinner)
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    override func layoutSubviews() {
        super.layoutSubviews()
        let center = CGPoint(x: bounds.midX, y: bounds.midY)
        ticks.center = center
        spinner.center = center
    }

    /// Shows the ticks a pull `progress` of the way to the threshold brings in.
    func reveal(_ progress: CGFloat) {
        UIView.performWithoutAnimation {
            for (index, tick) in ticks.subviews.enumerated() {
                tick.alpha = min(max(progress * CGFloat(Self.tickCount) - CGFloat(index), 0), 1)
            }
        }
    }

    /// The little pop of a `UIRefreshControl` reaching its threshold.
    func pop() {
        let pop = CAKeyframeAnimation(keyPath: "transform.scale")
        pop.values = [1, 1.25, 1]
        pop.keyTimes = [0, 0.4, 1]
        pop.duration = 0.15
        ticks.layer.add(pop, forKey: "pop")
    }

    func begin() {
        ticks.isHidden = true
        spinner.startAnimating()
    }

    func end() {
        spinner.stopAnimating()
        ticks.isHidden = false
        reveal(0)
    }
}

/// Holds the app's web view and pulls the whole of it down to reload, top
/// bar and all, with the spinner above the top bar's buttons.
///
/// Not a `UIRefreshControl`: that pulls the page within the web view, where
/// WebKit keeps the page's fixed top bar in place while it is pulled and then
/// lowers it in one go while it refreshes. Moving the web view itself moves
/// everything on it together. Capacitor makes the web view its controller's
/// own view, so the gap and the spinner need a controller around it.
class MainViewController: UIViewController {
    /// How far below the status bar the page is held while it reloads, and
    /// how far it has to be pulled for that.
    private static let holdBelowStatusBar: CGFloat = 60

    private let bridgeViewController = BridgeViewController()
    private let indicator = RefreshIndicator()
    private let feedback = UIImpactFeedbackGenerator(style: .light)
    private var observations: [NSKeyValueObservation] = []
    /// The finger's position, in the pull's terms, when the page reached its
    /// top; set while a pull is under way.
    private var pullStart: CGFloat?
    private var pull: CGFloat = 0
    private var isRefreshing = false
    /// The page as it was, laid over the web view while it reloads.
    private var cover: UIView?

    override var childForStatusBarStyle: UIViewController? {
        bridgeViewController
    }

    override var childForStatusBarHidden: UIViewController? {
        bridgeViewController
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        // The page's background (`pca-white`, `pca-grey-900`) until the page
        // has one; the gap shows it.
        view.backgroundColor = UIColor { traits in
            traits.userInterfaceStyle == .dark
                ? UIColor(red: 0x10 / 255, green: 0x10 / 255, blue: 0x10 / 255, alpha: 1)
                : .white
        }

        addChild(bridgeViewController)
        bridgeViewController.view.frame = view.bounds
        bridgeViewController.view.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        view.addSubview(bridgeViewController.view)
        bridgeViewController.didMove(toParent: self)
        // In front of the page: the top of the web view is the page's empty
        // band under the status bar, which would cover the spinner until
        // the page is well on its way down.
        view.addSubview(indicator)

        guard let webView = bridgeViewController.webView else {
            return
        }

        let scrollView = webView.scrollView
        scrollView.panGestureRecognizer.addTarget(self, action: #selector(pan(_:)))
        observations = [
            scrollView.observe(\.contentOffset) { [weak self] scrollView, _ in
                self?.follow(scrollView)
            },
            webView.observe(\.isLoading) { [weak self] webView, _ in
                if !webView.isLoading {
                    self?.reloaded()
                }
            },
            // The background of the page itself (the yellow of the sign in
            // page, say), which WebKit takes from its body: behind the web
            // view while it is pulled down, and in the web view where it
            // bounces past the end of the page, which Capacitor paints in the
            // system background.
            webView.observe(\.underPageBackgroundColor, options: [.initial]) { [weak self] webView, _ in
                let color = webView.underPageBackgroundColor
                self?.view.backgroundColor = color
                webView.backgroundColor = color
                webView.scrollView.backgroundColor = color
            },
        ]
    }

    override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()
        placeIndicator(for: pull)
    }

    /*
     * Over the empty band between the status bar and the top bar's buttons:
     * the page's own room for the status bar, which comes down with it, and
     * which opens just as far as the page has come down.
     */
    private func placeIndicator(for pull: CGFloat) {
        indicator.center = CGPoint(x: view.bounds.midX, y: view.safeAreaInsets.top + pull / 2)
        indicator.alpha = pull > 0 ? 1 : 0
        if !isRefreshing {
            indicator.reveal(pull / holdHeight)
        }
    }

    private var holdHeight: CGFloat {
        view.safeAreaInsets.top + Self.holdBelowStatusBar
    }

    /*
     * A finger pulling the page down past its top moves the web view instead
     * of the page within it: the page stays at its top, and the web view
     * follows the finger with the resistance of a scroll view's bounce. A
     * fling that runs into the top still bounces within the web view.
     */
    private func follow(_ scrollView: UIScrollView) {
        guard scrollView.isTracking, !isRefreshing else {
            return
        }

        let top = -scrollView.adjustedContentInset.top
        let finger = scrollView.panGestureRecognizer.translation(in: view).y
        if pullStart == nil {
            guard scrollView.contentOffset.y < top else {
                return
            }

            pullStart = finger - (top - scrollView.contentOffset.y)
        }

        let distance = finger - (pullStart ?? finger)
        guard distance > 0 else {
            pullStart = nil
            move(to: 0)
            return
        }

        if scrollView.contentOffset.y != top {
            scrollView.contentOffset.y = top
        }
        move(to: rubberBand(distance))
    }

    /// The resistance `UIScrollView` pulls past its edge with.
    private func rubberBand(_ distance: CGFloat) -> CGFloat {
        let dimension = view.bounds.height
        return (1 - 1 / (distance * 0.55 / dimension + 1)) * dimension
    }

    private func move(to pull: CGFloat) {
        let wasPastThreshold = self.pull >= holdHeight
        self.pull = pull
        bridgeViewController.view.transform = CGAffineTransform(translationX: 0, y: pull)
        placeIndicator(for: pull)
        if pull >= holdHeight && !wasPastThreshold {
            feedback.impactOccurred()
            indicator.pop()
        }
    }

    @objc private func pan(_ gesture: UIPanGestureRecognizer) {
        guard gesture.state == .ended || gesture.state == .cancelled,
              pullStart != nil else {
            return
        }

        pullStart = nil
        // Whatever the finger flung, the page stays at its top.
        if let scrollView = bridgeViewController.webView?.scrollView {
            scrollView.setContentOffset(
                CGPoint(x: 0, y: -scrollView.adjustedContentInset.top),
                animated: false
            )
        }

        if pull >= holdHeight && gesture.state == .ended, let webView = bridgeViewController.webView {
            isRefreshing = true
            indicator.begin()
            settle(at: holdHeight)
            // A reload throws the page away a few frames before the new one
            // paints, which leaves the web view white, top bar and all; the
            // page as it was stays on top until the new one has loaded.
            if let cover = webView.snapshotView(afterScreenUpdates: false) {
                cover.frame = webView.bounds
                webView.addSubview(cover)
                self.cover = cover
            }
            webView.reload()
        }
        else {
            settle(at: 0)
        }
    }

    private func settle(at pull: CGFloat) {
        self.pull = pull
        UIView.animate(
            withDuration: 0.5,
            delay: 0,
            usingSpringWithDamping: 1,
            initialSpringVelocity: 0,
            options: [.allowUserInteraction, .beginFromCurrentState]
        ) {
            self.bridgeViewController.view.transform = CGAffineTransform(translationX: 0, y: pull)
            self.placeIndicator(for: pull)
        }
    }

    private func reloaded() {
        guard isRefreshing else {
            return
        }

        isRefreshing = false
        indicator.end()
        settle(at: 0)
        if let cover = cover {
            self.cover = nil
            UIView.animate(withDuration: 0.25) {
                cover.alpha = 0
            } completion: { _ in
                cover.removeFromSuperview()
            }
        }
    }
}
